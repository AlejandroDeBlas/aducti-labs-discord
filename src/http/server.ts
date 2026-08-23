import fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import fastifyRawBody from 'fastify-raw-body';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { checkoutRoutes } from './routes/checkout.js';
import { webhookRoutes } from './routes/webhooks.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export async function buildHttpServer(): Promise<FastifyInstance> {
  const app = fastify({
    logger: false, // We use our own pino logger instance
    trustProxy: true,
  });

  // Enable raw body support for Stripe webhooks
  await app.register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(cookie, {
    secret: env.SESSION_SECRET,
  });

  // Register routes
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(checkoutRoutes);
  await app.register(webhookRoutes);

  return app;
}

export async function startHttpServer(): Promise<FastifyInstance> {
  const app = await buildHttpServer();
  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info({ port: env.PORT, host: env.HOST }, `HTTP Server running at http://${env.HOST}:${env.PORT}`);
  return app;
}
