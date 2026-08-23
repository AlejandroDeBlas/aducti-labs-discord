import type { FastifyPluginAsync } from 'fastify';
import { checkDbConnection } from '../../db/index.js';
import { getDiscordClient } from '../../discord/client.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_req, reply) => {
    const isDbConnected = await checkDbConnection();
    const discordClient = getDiscordClient();
    const isDiscordConnected = discordClient.isReady() && discordClient.ws.status === 0;

    const isHealthy = isDbConnected && isDiscordConnected;

    return reply.status(isHealthy ? 200 : 503).send({
      status: isHealthy ? 'ok' : 'degraded',
      discord: isDiscordConnected ? 'connected' : 'disconnected',
      database: isDbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });
};
