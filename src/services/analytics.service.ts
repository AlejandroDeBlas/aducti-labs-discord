import { db } from '../db/index.js';
import { analyticsEvents, users, subscriptions, discordRoleState } from '../db/schema.js';
import { eq, gte, and, sql, desc } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export type AnalyticsEventType =
  | 'discord_join'
  | 'labs_member_activated'
  | 'onboarding_completed'
  | 'pro_cta_clicked'
  | 'founder_cta_clicked'
  | 'checkout_started'
  | 'checkout_completed'
  | 'subscription_activated'
  | 'subscription_cancelled'
  | 'subscription_ended';

export class AnalyticsService {
  static async trackEvent(
    eventName: AnalyticsEventType,
    params: {
      userId?: string | null;
      discordUserId?: string | null;
      properties?: Record<string, any>;
    } = {}
  ) {
    try {
      await db.insert(analyticsEvents).values({
        eventName,
        userId: params.userId ?? null,
        discordUserId: params.discordUserId ?? null,
        properties: params.properties ?? {},
        createdAt: new Date(),
      });

      logger.debug(
        { eventName, userId: params.userId, discordUserId: params.discordUserId },
        'Analytics event tracked'
      );
    } catch (err) {
      logger.error({ err, eventName }, 'Failed to track analytics event');
    }
  }

  static async getFunnelMetrics(): Promise<{
    totalMembers: number;
    activatedMembers: number;
    activePro: number;
    activeFounders: number;
    founderSlotsRemaining: number;
    newMembers7d: number;
    checkoutsStarted7d: number;
    newPro7d: number;
    cancellations30d: number;
    topInterests: { interest: string; count: number }[];
    topProfiles: { profile: string; count: number }[];
  }> {
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // 1. Total and Activated Members
    const allUsers = await db.query.users.findMany();
    const totalMembers = allUsers.length;
    const activatedMembers = allUsers.filter(
      (u) => u.primaryInterest !== null || u.onboardingCompletedAt !== null
    ).length;

    // 2. Active Pro and Founder counts
    const activeSubs = await db.query.subscriptions.findMany({
      where: eq(subscriptions.status, 'active'),
    });
    const activePro = activeSubs.length;

    const founderRoleStates = await db.query.discordRoleState.findMany({
      where: eq(discordRoleState.founderRole, true),
    });
    const activeFounders = founderRoleStates.length;
    const founderSlotsRemaining = Math.max(0, env.FOUNDER_MAX_MEMBERS - activeFounders);

    // 3. New Members in last 7 days
    const newMembers7d = allUsers.filter((u) => u.createdAt >= sevenDaysAgo).length;

    // 4. Events in last 7 days / 30 days
    const checkoutsStarted7dResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventName, 'checkout_started'),
          gte(analyticsEvents.createdAt, sevenDaysAgo)
        )
      );
    const checkoutsStarted7d = Number(checkoutsStarted7dResult[0]?.count ?? 0);

    const newPro7dResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventName, 'subscription_activated'),
          gte(analyticsEvents.createdAt, sevenDaysAgo)
        )
      );
    const newPro7d = Number(newPro7dResult[0]?.count ?? 0);

    const cancellations30dResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventName, 'subscription_cancelled'),
          gte(analyticsEvents.createdAt, thirtyDaysAgo)
        )
      );
    const cancellations30d = Number(cancellations30dResult[0]?.count ?? 0);

    // 5. Segmentation breakdown
    const interestCounts: Record<string, number> = {};
    const profileCounts: Record<string, number> = {};

    for (const u of allUsers) {
      if (u.primaryInterest) {
        interestCounts[u.primaryInterest] = (interestCounts[u.primaryInterest] || 0) + 1;
      }
      if (u.userProfile) {
        profileCounts[u.userProfile] = (profileCounts[u.userProfile] || 0) + 1;
      }
    }

    const topInterests = Object.entries(interestCounts)
      .map(([interest, count]) => ({ interest, count }))
      .sort((a, b) => b.count - a.count);

    const topProfiles = Object.entries(profileCounts)
      .map(([profile, count]) => ({ profile, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalMembers,
      activatedMembers,
      activePro,
      activeFounders,
      founderSlotsRemaining,
      newMembers7d,
      checkoutsStarted7d,
      newPro7d,
      cancellations30d,
      topInterests,
      topProfiles,
    };
  }
}
