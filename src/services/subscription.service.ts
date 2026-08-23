import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  subscriptions,
  webhookEvents,
  type Subscription,
  type WebhookEvent,
} from '../db/schema.js';
import { UserService } from './user.service.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import type Stripe from 'stripe';

export interface AccessEvaluation {
  hasProAccess: boolean;
  hasFounderRole: boolean;
  reason: string;
}

export class SubscriptionService {
  /**
   * Evaluates whether a Stripe subscription grants active PRO access according to official rules:
   * - 'active' or 'trialing' => PRO Access Granted
   * - 'past_due' => (depends on grace period, Stripe considers still active during grace period, but standard is active/trialing)
   * - 'canceled' / 'unpaid' / 'incomplete_expired' => PRO Access Revoked
   * - cancel_at_period_end = true with current_period_end in future => PRO Access Kept until period end
   */
  static isSubscriptionActive(sub: {
    status: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: Date | null;
  }): boolean {
    const activeStatuses = ['active', 'trialing'];
    if (activeStatuses.includes(sub.status)) {
      return true;
    }

    // If canceled with cancel_at_period_end and currentPeriodEnd is still in the future
    if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() > Date.now()) {
      return true;
    }

    return false;
  }

  /**
   * Determines if a Stripe Price ID corresponds to the Founder plan
   */
  static isFounderPrice(priceId: string): boolean {
    return Boolean(env.STRIPE_PRICE_FOUNDER_ID && priceId === env.STRIPE_PRICE_FOUNDER_ID);
  }

  /**
   * Idempotently records a webhook event before processing
   */
  static async recordWebhookEvent(
    eventId: string,
    eventType: string,
    provider = 'stripe'
  ): Promise<{ alreadyProcessed: boolean; eventRecord: WebhookEvent }> {
    const existing = await db.query.webhookEvents.findFirst({
      where: eq(webhookEvents.eventId, eventId),
    });

    if (existing) {
      if (existing.status === 'success') {
        return { alreadyProcessed: true, eventRecord: existing };
      }
      return { alreadyProcessed: false, eventRecord: existing };
    }

    const [created] = await db
      .insert(webhookEvents)
      .values({
        provider,
        eventId,
        eventType,
        processedAt: new Date(),
        status: 'processing',
      })
      .returning();

    return { alreadyProcessed: false, eventRecord: created };
  }

  static async markWebhookSuccess(eventId: string) {
    await db
      .update(webhookEvents)
      .set({
        status: 'success',
        processedAt: new Date(),
      })
      .where(eq(webhookEvents.eventId, eventId));
  }

  static async markWebhookFailed(eventId: string) {
    await db
      .update(webhookEvents)
      .set({
        status: 'failed',
        processedAt: new Date(),
      })
      .where(eq(webhookEvents.eventId, eventId));
  }

  /**
   * Syncs a Stripe Subscription object into PostgreSQL
   */
  static async syncStripeSubscription(
    userId: string,
    stripeSubscription: Stripe.Subscription
  ): Promise<Subscription> {
    const priceId = stripeSubscription.items.data[0]?.price.id ?? '';
    const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    const cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
    const status = stripeSubscription.status;

    const existing = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, stripeSubscription.id),
    });

    if (existing) {
      const [updated] = await db
        .update(subscriptions)
        .set({
          stripePriceId: priceId,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existing.id))
        .returning();

      logger.info(
        { subscriptionId: updated.id, status, cancelAtPeriodEnd },
        'Stripe subscription updated in DB'
      );
      return updated;
    }

    const [created] = await db
      .insert(subscriptions)
      .values({
        userId,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
      })
      .returning();

    logger.info(
      { subscriptionId: created.id, status, cancelAtPeriodEnd },
      'Stripe subscription inserted in DB'
    );
    return created;
  }

  /**
   * Computes the target Discord roles for a user given their DB and Stripe state
   */
  static async computeUserTargetRoles(userId: string): Promise<{
    shouldHaveMember: boolean;
    shouldHavePro: boolean;
    shouldHaveFounder: boolean;
  }> {
    const user = await UserService.getUserById(userId);
    if (!user) {
      return { shouldHaveMember: false, shouldHavePro: false, shouldHaveFounder: false };
    }

    const userSubs = await db.query.subscriptions.findMany({
      where: eq(subscriptions.userId, userId),
    });

    const roleState = await UserService.getRoleState(userId);

    // Check if any subscription is active
    let hasActivePro = false;
    let isEverFounder = roleState?.founderRole ?? false;

    for (const sub of userSubs) {
      const isActive = this.isSubscriptionActive({
        status: sub.status,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        currentPeriodEnd: sub.currentPeriodEnd,
      });

      if (isActive) {
        hasActivePro = true;
        if (this.isFounderPrice(sub.stripePriceId)) {
          isEverFounder = true;
        }
      } else {
        // Even if inactive now, if it was a founder price, founder role is historically preserved
        if (this.isFounderPrice(sub.stripePriceId)) {
          isEverFounder = true;
        }
      }
    }

    return {
      // Once onboarded or subscribed, they have Member role
      shouldHaveMember: roleState?.memberRole || hasActivePro || isEverFounder,
      shouldHavePro: hasActivePro,
      // Founder role is permanent once achieved
      shouldHaveFounder: isEverFounder,
    };
  }
}
