import type { FastifyPluginAsync } from 'fastify';
import type Stripe from 'stripe';
import { StripeService } from '../../services/stripe.service.js';
import { SubscriptionService } from '../../services/subscription.service.js';
import { UserService } from '../../services/user.service.js';
import { AnalyticsService } from '../../services/analytics.service.js';
import { getDiscordClient, syncMemberDiscordRoles } from '../../discord/client.js';
import { DiscordLogger } from '../../discord/logger.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/webhooks/stripe',
    {
      config: {
        rawBody: true,
      },
    },
    async (req, reply) => {
      const signature = req.headers['stripe-signature'] as string | undefined;

      if (!signature) {
        logger.warn('Received Stripe webhook without stripe-signature header');
        return reply.status(400).send({ error: 'Missing stripe-signature header' });
      }

      const rawBody = (req as any).rawBody;
      if (!rawBody) {
        logger.error('Raw body not available in request');
        return reply.status(400).send({ error: 'Raw body required for signature verification' });
      }

      let event: Stripe.Event;
      try {
        event = StripeService.constructWebhookEvent(rawBody, signature);
      } catch (err: any) {
        logger.error({ err: err.message }, 'Stripe webhook signature verification failed');
        return reply.status(400).send({ error: `Webhook Signature Verification Error: ${err.message}` });
      }

      logger.info({ eventId: event.id, eventType: event.type }, 'Stripe webhook received');

      // Idempotency check
      const { alreadyProcessed } = await SubscriptionService.recordWebhookEvent(event.id, event.type);
      if (alreadyProcessed) {
        logger.info({ eventId: event.id }, 'Webhook event already processed previously, skipping');
        return reply.status(200).send({ received: true, status: 'already_processed' });
      }

      const client = getDiscordClient();
      const guild = client.isReady() ? client.guilds.cache.get(env.DISCORD_GUILD_ID) : null;

      try {
        switch (event.type) {
          // 1. Checkout session completed
          case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const discordUserId =
              session.metadata?.discord_user_id || session.client_reference_id;
            const plan = (session.metadata?.plan as 'pro' | 'founder') || 'pro';
            const customerId = session.customer as string | undefined;
            const subscriptionId = session.subscription as string | undefined;

            if (discordUserId && customerId) {
              const user = await UserService.getUserByDiscordId(discordUserId);
              if (user) {
                await UserService.linkStripeCustomer(user.id, customerId);

                if (subscriptionId) {
                  const stripeSub = await StripeService.getSubscription(subscriptionId);
                  await SubscriptionService.syncStripeSubscription(user.id, stripeSub);

                  const isFounder = plan === 'founder' || SubscriptionService.isFounderPrice(stripeSub.items.data[0]?.price.id ?? '');

                  // Apply Discord roles
                  await syncMemberDiscordRoles({
                    discordUserId,
                    addMember: true,
                    addPro: true,
                    addFounder: isFounder,
                  });

                  // Update DB role state
                  await UserService.updateRoleState(user.id, {
                    memberRole: true,
                    proRole: true,
                    founderRole: isFounder || undefined,
                  });

                  // Track funnel events
                  await AnalyticsService.trackEvent('checkout_completed', {
                    userId: user.id,
                    discordUserId,
                    properties: { plan, subscriptionId },
                  });

                  await AnalyticsService.trackEvent('subscription_activated', {
                    userId: user.id,
                    discordUserId,
                    properties: { plan, subscriptionId, isFounder },
                  });

                  if (guild) {
                    await DiscordLogger.logProActivated(
                      guild,
                      { id: discordUserId, tag: user.discordUsername },
                      { plan, priceId: stripeSub.items.data[0]?.price.id ?? '', subscriptionId }
                    );

                    if (isFounder) {
                      await DiscordLogger.logFounderActivated(
                        guild,
                        { id: discordUserId, tag: user.discordUsername },
                        { subscriptionId }
                      );
                    }
                  }
                }
              }
            }
            break;
          }

          // 2. Subscription created or updated
          case 'customer.subscription.created':
          case 'customer.subscription.updated': {
            const stripeSub = event.data.object as Stripe.Subscription;
            const customerId = stripeSub.customer as string;
            const discordUserId = stripeSub.metadata?.discord_user_id;

            let user = discordUserId ? await UserService.getUserByDiscordId(discordUserId) : null;
            if (!user && customerId) {
              user = await UserService.getUserByStripeCustomerId(customerId);
            }

            if (user) {
              await SubscriptionService.syncStripeSubscription(user.id, stripeSub);
              const targetRoles = await SubscriptionService.computeUserTargetRoles(user.id);

              if (stripeSub.cancel_at_period_end) {
                await AnalyticsService.trackEvent('subscription_cancelled', {
                  userId: user.id,
                  discordUserId: user.discordUserId,
                  properties: { subscriptionId: stripeSub.id },
                });
              }

              await syncMemberDiscordRoles({
                discordUserId: user.discordUserId,
                addMember: targetRoles.shouldHaveMember,
                addPro: targetRoles.shouldHavePro,
                removePro: !targetRoles.shouldHavePro,
                addFounder: targetRoles.shouldHaveFounder,
              });

              await UserService.updateRoleState(user.id, {
                memberRole: targetRoles.shouldHaveMember,
                proRole: targetRoles.shouldHavePro,
                founderRole: targetRoles.shouldHaveFounder,
              });
            }
            break;
          }

          // 3. Subscription deleted / expired
          case 'customer.subscription.deleted': {
            const stripeSub = event.data.object as Stripe.Subscription;
            const customerId = stripeSub.customer as string;
            const discordUserId = stripeSub.metadata?.discord_user_id;

            let user = discordUserId ? await UserService.getUserByDiscordId(discordUserId) : null;
            if (!user && customerId) {
              user = await UserService.getUserByStripeCustomerId(customerId);
            }

            if (user) {
              await SubscriptionService.syncStripeSubscription(user.id, stripeSub);
              const targetRoles = await SubscriptionService.computeUserTargetRoles(user.id);

              await AnalyticsService.trackEvent('subscription_ended', {
                userId: user.id,
                discordUserId: user.discordUserId,
                properties: { subscriptionId: stripeSub.id },
              });

              // Remove Pro role, but KEEP Founder role if existing
              await syncMemberDiscordRoles({
                discordUserId: user.discordUserId,
                removePro: true,
              });

              await UserService.updateRoleState(user.id, {
                proRole: false,
                founderRole: targetRoles.shouldHaveFounder,
              });

              if (guild) {
                await DiscordLogger.logProRemoved(
                  guild,
                  { id: user.discordUserId, tag: user.discordUsername },
                  'Periodo de suscripción finalizado'
                );
              }
            }
            break;
          }

          // 4. Invoice payment failed
          case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string | undefined;

            let user = customerId ? await UserService.getUserByStripeCustomerId(customerId) : null;

            if (guild) {
              await DiscordLogger.logPaymentFailed(
                guild,
                user ? { id: user.discordUserId, tag: user.discordUsername } : null,
                {
                  invoiceId: invoice.id,
                  amount: invoice.amount_due,
                  currency: invoice.currency,
                }
              );
            }
            break;
          }

          default:
            logger.debug({ eventType: event.type }, 'Unhandled Stripe webhook event type');
            break;
        }

        await SubscriptionService.markWebhookSuccess(event.id);
        return reply.status(200).send({ received: true });
      } catch (err: any) {
        logger.error({ err, eventId: event.id }, 'Error processing Stripe webhook');
        await SubscriptionService.markWebhookFailed(event.id);
        return reply.status(500).send({ error: 'Error processing webhook event' });
      }
    }
  );
};
