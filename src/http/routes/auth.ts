import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env.js';
import { generateOAuthState, verifyOAuthState } from '../../utils/security.js';
import { UserService } from '../../services/user.service.js';
import { StripeService } from '../../services/stripe.service.js';
import { SubscriptionService } from '../../services/subscription.service.js';
import { AnalyticsService } from '../../services/analytics.service.js';
import { logger } from '../../utils/logger.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Initiate Discord OAuth2 Flow
  fastify.get('/auth/discord', async (req, reply) => {
    const { plan = 'pro' } = req.query as { plan?: string };
    let validPlan: 'pro' | 'founder' = plan === 'founder' ? 'founder' : 'pro';

    // Verify Founder availability
    if (validPlan === 'founder') {
      const founderStatus = await SubscriptionService.getFounderSlotsStatus();
      if (!founderStatus.isAvailable) {
        logger.info('Founder slots filled, falling back to Pro plan');
        validPlan = 'pro';
      }
    }

    // Track CTA click
    await AnalyticsService.trackEvent(
      validPlan === 'founder' ? 'founder_cta_clicked' : 'pro_cta_clicked',
      {
        properties: { requestedPlan: plan, resolvedPlan: validPlan },
      }
    );

    const state = generateOAuthState(validPlan);

    const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
    discordAuthUrl.searchParams.set('client_id', env.DISCORD_CLIENT_ID);
    discordAuthUrl.searchParams.set('redirect_uri', env.DISCORD_REDIRECT_URI);
    discordAuthUrl.searchParams.set('response_type', 'code');
    discordAuthUrl.searchParams.set('scope', 'identify');
    discordAuthUrl.searchParams.set('state', state);

    return reply.redirect(discordAuthUrl.toString());
  });

  // 2. Handle Discord OAuth2 Callback
  fastify.get('/auth/discord/callback', async (req, reply) => {
    const { code, state, error } = req.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    if (error || !code || !state) {
      logger.warn({ error }, 'Discord OAuth authorization canceled or failed');
      return reply.type('text/html').send(`
        <html>
          <head>
            <meta charset="utf-8">
            <title>Autorización Cancelada • Aducti Labs</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
              * { font-family: 'Inter', sans-serif; }
            </style>
          </head>
          <body style="background: #0f172a; color: #f8fafc; text-align: center; padding: 50px;">
            <h2>Autorización Cancelada</h2>
            <p style="color: #94a3b8;">No se pudo completar la autenticación con Discord. Puedes cerrar esta ventana e intentarlo de nuevo desde Discord.</p>
          </body>
        </html>
      `);
    }

    // Verify state token
    const { valid, payload } = verifyOAuthState(state);
    if (!valid || !payload) {
      logger.warn('Invalid or expired OAuth state token');
      return reply.status(400).send({ error: 'Estado de autenticación inválido o expirado' });
    }

    try {
      // Exchange authorization code for Discord access token
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: env.DISCORD_CLIENT_ID,
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: env.DISCORD_REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        logger.error({ errorText }, 'Failed to exchange Discord authorization code');
        return reply.status(500).send({ error: 'Error al comunicarse con la API de Discord' });
      }

      const tokenData = (await tokenResponse.json()) as { access_token: string; token_type: string };

      // Fetch user profile from Discord
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `${tokenData.token_type} ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        logger.error('Failed to fetch Discord user profile');
        return reply.status(500).send({ error: 'Error al obtener el perfil de Discord' });
      }

      const discordUser = (await userResponse.json()) as {
        id: string;
        username: string;
        global_name?: string | null;
      };

      // Persist or update user in PostgreSQL
      const user = await UserService.upsertUser({
        discordUserId: discordUser.id,
        discordUsername: discordUser.username,
        discordGlobalName: discordUser.global_name,
      });

      // Check if user already has an existing Stripe customer
      const existingUserWithCustomer = await UserService.getUserByDiscordId(discordUser.id);
      const stripeCustomerId = existingUserWithCustomer?.stripeCustomer?.stripeCustomerId;

      // Create Stripe Checkout Session
      const checkoutSession = await StripeService.createCheckoutSession({
        discordUserId: discordUser.id,
        discordUsername: discordUser.username,
        plan: payload.plan,
        stripeCustomerId,
        successUrl: `${env.APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${env.APP_URL}/checkout/canceled`,
      });

      if (!checkoutSession.url) {
        throw new Error('Stripe Checkout Session URL was not generated');
      }

      // Track checkout started
      await AnalyticsService.trackEvent('checkout_started', {
        userId: user.id,
        discordUserId: discordUser.id,
        properties: {
          plan: payload.plan,
          sessionId: checkoutSession.id,
        },
      });

      return reply.redirect(checkoutSession.url);
    } catch (err: any) {
      logger.error({ err }, 'Error during OAuth callback processing');
      return reply.status(500).send({ error: 'Error al procesar el inicio de sesión' });
    }
  });
};
