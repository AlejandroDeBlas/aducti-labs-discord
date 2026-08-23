import {
  Client,
  GatewayIntentBits,
  Partials,
  type Guild,
  type GuildMember,
} from 'discord.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { INTERACTION_IDS, ROLE_NAMES } from '../config/constants.js';
import { OnboardingHandler } from './onboarding.js';
import { handleSlashCommand, registerSlashCommands } from './commands/index.js';
import { MessageManager } from './messages.js';

let discordClient: Client | null = null;

export function getDiscordClient(): Client {
  if (!discordClient) {
    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
    });

    discordClient.on('ready', async (client) => {
      logger.info({ tag: client.user.tag, id: client.user.id }, 'Discord Bot Client is READY');

      try {
        const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
        if (guild) {
          logger.info({ guildName: guild.name, memberCount: guild.memberCount }, 'Connected to target Guild');
          // Register slash commands
          await registerSlashCommands(env.DISCORD_CLIENT_ID, env.DISCORD_BOT_TOKEN, guild.id);
        }
      } catch (err) {
        logger.error({ err }, 'Failed to fetch guild or register commands on ready');
      }
    });

    discordClient.on('interactionCreate', async (interaction) => {
      try {
        if (interaction.isButton()) {
          if (interaction.customId === INTERACTION_IDS.ONBOARDING_JOIN) {
            await OnboardingHandler.handleJoinInteraction(interaction);
          }
        } else if (interaction.isChatInputCommand()) {
          await handleSlashCommand(interaction, discordClient!);
        }
      } catch (err) {
        logger.error({ err }, 'Error handling Discord interaction');
      }
    });

    discordClient.on('error', (err) => {
      logger.error({ err }, 'Discord client error');
    });
  }

  return discordClient;
}

export async function initDiscordClient(): Promise<Client> {
  const client = getDiscordClient();
  if (!client.isReady()) {
    await client.login(env.DISCORD_BOT_TOKEN);
  }
  return client;
}

/**
 * Helper to update a member's roles directly in the Discord Guild
 */
export async function syncMemberDiscordRoles(params: {
  discordUserId: string;
  addPro?: boolean;
  removePro?: boolean;
  addFounder?: boolean;
  addMember?: boolean;
}): Promise<GuildMember | null> {
  const client = getDiscordClient();
  if (!client.isReady()) return null;

  try {
    const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
    if (!guild) return null;

    const member = await guild.members.fetch(params.discordUserId);
    if (!member) return null;

    const rolesToAdd: string[] = [];
    const rolesToRemove: string[] = [];

    const memberRole = guild.roles.cache.find((r) => r.name === ROLE_NAMES.MEMBER);
    const proRole = guild.roles.cache.find((r) => r.name === ROLE_NAMES.PRO);
    const founderRole = guild.roles.cache.find((r) => r.name === ROLE_NAMES.FOUNDER);

    if (params.addMember && memberRole && !member.roles.cache.has(memberRole.id)) {
      rolesToAdd.push(memberRole.id);
    }

    if (params.addPro && proRole && !member.roles.cache.has(proRole.id)) {
      rolesToAdd.push(proRole.id);
    }

    if (params.removePro && proRole && member.roles.cache.has(proRole.id)) {
      rolesToRemove.push(proRole.id);
    }

    if (params.addFounder && founderRole && !member.roles.cache.has(founderRole.id)) {
      rolesToAdd.push(founderRole.id);
    }

    if (rolesToAdd.length > 0) {
      await member.roles.add(rolesToAdd, 'Aducti Labs Subscription Update');
    }

    if (rolesToRemove.length > 0) {
      await member.roles.remove(rolesToRemove, 'Aducti Labs Subscription Update');
    }

    return member;
  } catch (err) {
    logger.error({ err, params }, 'Failed to sync member roles in Discord guild');
    return null;
  }
}
