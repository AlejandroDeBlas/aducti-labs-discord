import { runMigrations } from '../db/migrate.js';
import { initDiscordClient, getDiscordClient } from '../discord/client.js';
import { DiscordSyncEngine } from '../discord/sync.js';
import { MessageManager } from '../discord/messages.js';
import { registerSlashCommands } from '../discord/commands/index.js';
import { ReconcileService } from '../services/reconcile.service.js';
import { pool } from '../db/index.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

async function bootstrap() {
  logger.info('=== INICIANDO BOOTSTRAP DE ADUCTI LABS DISCORD ===');

  try {
    // 1. Database Migrations
    logger.info('Paso 1: Aplicando migraciones de base de datos...');
    await runMigrations();

    // 2. Discord Bot Login
    logger.info('Paso 2: Conectando cliente de Discord...');
    const client = await initDiscordClient();

    // Wait until ready
    if (!client.isReady()) {
      await new Promise<void>((resolve) => client.once('ready', () => resolve()));
    }

    const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
    if (!guild) {
      throw new Error(`Guild con ID ${env.DISCORD_GUILD_ID} no encontrado.`);
    }
    logger.info({ guildName: guild.name }, 'Guild conectado.');

    // 3. Declarative Server Sync
    logger.info('Paso 3: Sincronizando estructura declarativa (roles, categorías, canales, permisos)...');
    const syncResult = await DiscordSyncEngine.syncServer(guild);
    logger.info(syncResult, 'Estructura del servidor sincronizada.');

    // 4. Initial Messages
    logger.info('Paso 4: Publicando/Actualizando mensajes interactivos (#bienvenida y #hazte-pro)...');
    await MessageManager.syncWelcomeMessage(guild);
    await MessageManager.syncProMessage(guild);

    // 5. Slash Commands
    logger.info('Paso 5: Registrando comandos slash (/status, /pro, /sync)...');
    await registerSlashCommands(env.DISCORD_CLIENT_ID, env.DISCORD_BOT_TOKEN, guild.id);

    // 6. Reconciliation
    logger.info('Paso 6: Ejecutando reconciliación inicial...');
    const reconResult = await ReconcileService.reconcileGuildMembers(guild);
    logger.info(reconResult, 'Reconciliación inicial finalizada.');

    logger.info('=== BOOTSTRAP COMPLETADO CON ÉXITO ===');
  } catch (err) {
    logger.error({ err }, 'Error durante el bootstrap');
    process.exitCode = 1;
  } finally {
    const client = getDiscordClient();
    client.destroy();
    await pool.end();
  }
}

bootstrap();
