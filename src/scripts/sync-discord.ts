import { initDiscordClient, getDiscordClient } from '../discord/client.js';
import { DiscordSyncEngine } from '../discord/sync.js';
import { MessageManager } from '../discord/messages.js';
import { pool } from '../db/index.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

async function sync() {
  logger.info('=== INICIANDO SINCRONIZACIÓN DE DISCORD ===');

  try {
    const client = await initDiscordClient();
    if (!client.isReady()) {
      await new Promise<void>((resolve) => client.once('ready', () => resolve()));
    }

    const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
    if (!guild) {
      throw new Error(`Guild con ID ${env.DISCORD_GUILD_ID} no encontrado.`);
    }

    const syncResult = await DiscordSyncEngine.syncServer(guild);
    await MessageManager.syncWelcomeMessage(guild);
    await MessageManager.syncProMessage(guild);

    logger.info(syncResult, '=== SINCRONIZACIÓN DE DISCORD COMPLETADA ===');
  } catch (err) {
    logger.error({ err }, 'Error durante la sincronización');
    process.exitCode = 1;
  } finally {
    const client = getDiscordClient();
    client.destroy();
    await pool.end();
  }
}

sync();
