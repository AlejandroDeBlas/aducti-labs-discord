import {
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type Client,
} from 'discord.js';
import { checkDbConnection, db } from '../../db/index.js';
import { subscriptions } from '../../db/schema.js';
import { getStripeClient } from '../../services/stripe.service.js';
import { DiscordSyncEngine } from '../sync.js';
import { ReconcileService } from '../../services/reconcile.service.js';
import { EMBED_COLORS, ROLE_NAMES } from '../../config/constants.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { eq } from 'drizzle-orm';

export const slashCommands = [
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Muestra el estado operativo del bot, base de datos, Stripe y servidor.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('pro')
    .setDescription('Información sobre las ventajas y acceso a Aducti Labs Pro.'),

  new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Sincroniza la estructura declarativa y reconcilia suscripciones (Solo Owner).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
];

export async function registerSlashCommands(
  clientId: string,
  token: string,
  guildId: string
) {
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    logger.info('Registering application slash commands...');
    const commandData = slashCommands.map((cmd) => cmd.toJSON());
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commandData,
    });
    logger.info('Application slash commands registered successfully');
  } catch (err) {
    logger.error({ err }, 'Failed to register slash commands');
    throw err;
  }
}

export async function handleSlashCommand(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  const { commandName } = interaction;

  if (commandName === 'status') {
    await interaction.deferReply({ ephemeral: true });

    const isDbConnected = await checkDbConnection();

    let isStripeConnected = false;
    try {
      await getStripeClient().balance.retrieve();
      isStripeConnected = true;
    } catch {
      isStripeConnected = false;
    }

    const guild = interaction.guild;
    const memberCount = guild?.memberCount ?? 0;

    let activeProCount = 0;
    try {
      const activeSubs = await db.query.subscriptions.findMany({
        where: eq(subscriptions.status, 'active'),
      });
      activeProCount = activeSubs.length;
    } catch {
      activeProCount = 0;
    }

    const uptimeSeconds = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setTitle('📊 Estado del Sistema • Aducti Labs')
      .addFields(
        {
          name: '🤖 Bot Gateway',
          value: client.ws.status === 0 ? '🟢 Conectado' : '🔴 Desconectado',
          inline: true,
        },
        {
          name: '🐘 PostgreSQL',
          value: isDbConnected ? '🟢 Conectado' : '🔴 Error de conexión',
          inline: true,
        },
        {
          name: '💳 Stripe API',
          value: isStripeConnected ? '🟢 Operativo' : '🔴 Error API',
          inline: true,
        },
        {
          name: '👥 Miembros Servidor',
          value: `${memberCount}`,
          inline: true,
        },
        {
          name: '⭐ Suscriptores PRO',
          value: `${activeProCount}`,
          inline: true,
        },
        {
          name: '⏱️ Uptime Proceso',
          value: `${hours}h ${minutes}m`,
          inline: true,
        }
      )
      .setFooter({ text: 'Aducti Labs • Sistema de Gestión' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } else if (commandName === 'pro') {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRO)
      .setTitle('⭐ Aducti Labs Pro')
      .setDescription(
        'Accede a workshops técnicos semanales, soporte técnico de alto nivel, código fuente de producción y salas privadas de coworking y directos.'
      )
      .setFooter({ text: 'Aducti Labs Pro' });

    const checkoutUrl = `${env.APP_URL}/auth/discord?plan=pro`;
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Obtener Labs Pro')
        .setStyle(ButtonStyle.Link)
        .setURL(checkoutUrl)
        .setEmoji('⭐')
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  } else if (commandName === 'sync') {
    if (!interaction.guild) return;

    // Check if user is owner or has owner role
    const member = interaction.member;
    const isOwner =
      interaction.guild.ownerId === interaction.user.id ||
      (member as any)?.roles?.cache?.some((r: any) => r.name === ROLE_NAMES.OWNER);

    if (!isOwner) {
      await interaction.reply({
        content: '⛔ Este comando solo puede ser ejecutado por el propietario del servidor.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      await DiscordSyncEngine.syncServer(interaction.guild);
      const reconResult = await ReconcileService.reconcileGuildMembers(interaction.guild);

      await interaction.editReply({
        content: `✅ **Sincronización completada.**\n- Servidor actualizado según configuración declarativa.\n- Reconciliación: ${reconResult.checked} usuarios auditados (+${reconResult.rolesAdded} roles añadidos, -${reconResult.rolesRemoved} retirados).`,
      });
    } catch (err: any) {
      logger.error({ err }, 'Error during /sync slash command');
      await interaction.editReply({
        content: `❌ Error al sincronizar: ${err?.message || 'Error desconocido'}`,
      });
    }
  }
}
