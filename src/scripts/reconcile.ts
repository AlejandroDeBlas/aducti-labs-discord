import { initDiscordClient, getDiscordClient } from '../discord/client.js';
import { ReconcileService } from '../services/reconcile.service.js';
import { pool } from '../db/index.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

async function reconcile() {
  logger.info('=== INICIANDO RECONCILIACIÓN DB ↔ DISCORD ↔ STRIPE ===');

  try {
    const client = await initDiscordClient();
    if (!client.isReady()) {
      await new Promise<void>((resolve) => client.once('ready', () => resolve()));
    }

    const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
    if (!guild) {
      throw new Error(`Guild con ID ${env.DISCORD_GUILD_ID} no encontrado.`);
    }

    const reconResult = await ReconcileService.reconcileGuildMembers(guild);
    logger.info(reconResult, '=== RECONCILIACIÓN COMPLETADA CON ÉXITO ===');
    client.destroy();
    await pool.end();
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error durante la reconciliación');
    getDiscordClient().destroy();
    await pool.end();
    process.exit(1);
  }
}

reconcile();
