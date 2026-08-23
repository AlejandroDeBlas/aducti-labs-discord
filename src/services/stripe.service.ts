import Stripe from 'stripe';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia' as any,
      typescript: true,
    });
  }
  return stripeInstance;
}

export class StripeService {
  static get client(): Stripe {
    return getStripeClient();
  }

  static async createCheckoutSession(params: {
    discordUserId: string;
    discordUsername: string;
    plan: 'pro' | 'founder';
    stripeCustomerId?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    const priceId =
      params.plan === 'founder' && env.STRIPE_PRICE_FOUNDER_ID
        ? env.STRIPE_PRICE_FOUNDER_ID
        : env.STRIPE_PRICE_PRO_ID;

    if (!priceId) {
      throw new Error(`No Stripe Price ID configured for plan: ${params.plan}`);
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: params.discordUserId,
      metadata: {
        discord_user_id: params.discordUserId,
        discord_username: params.discordUsername,
        plan: params.plan,
      },
      subscription_data: {
        metadata: {
          discord_user_id: params.discordUserId,
          discord_username: params.discordUsername,
          plan: params.plan,
        },
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      allow_promotion_codes: true,
    };

    if (params.stripeCustomerId) {
      sessionParams.customer = params.stripeCustomerId;
      sessionParams.customer_update = {
        name: 'auto',
        address: 'auto',
      };
    }

    logger.info(
      { discordUserId: params.discordUserId, plan: params.plan, priceId },
      'Creating Stripe Checkout Session'
    );

    return await this.client.checkout.sessions.create(sessionParams);
  }

  static constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    return this.client.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  }

  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.client.subscriptions.retrieve(subscriptionId);
  }
}
