import { runMigrations } from './db/migrate.js';
import { initDiscordClient, getDiscordClient } from './discord/client.js';
import { startHttpServer } from './http/server.js';
import { pool } from './db/index.js';
import { logger } from './utils/logger.js';

export async function bootstrapApp() {
  logger.info('Starting Aducti Labs Discord Service...');

  // 1. Run migrations
  try {
    await runMigrations();
  } catch (err) {
    logger.warn({ err }, 'No se pudieron aplicar las migraciones de base de datos en el arranque (PostgreSQL desconectado)');
  }

  // 2. Start HTTP Server
  const httpServer = await startHttpServer();

  // 3. Connect Discord Bot Client
  try {
    await initDiscordClient();
  } catch (err) {
    logger.error({ err }, 'Failed to initialize Discord client on startup');
  }

  // 4. Graceful Shutdown Handlers
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, shutting down gracefully...');
    try {
      await httpServer.close();
      const discord = getDiscordClient();
      discord.destroy();
      await pool.end();
      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
