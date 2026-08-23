import {
  ChannelType,
  type Guild,
  type CategoryChannel,
  type Role,
  PermissionsBitField,
} from 'discord.js';
import { DECLARATIVE_SERVER_CONFIG } from '../config/discord.js';
import { logger } from '../utils/logger.js';

export class DiscordSyncEngine {
  /**
   * Fully synchronizes roles, categories, channels, and permissions idempotently.
   */
  static async syncServer(guild: Guild): Promise<{
    rolesMap: Record<string, string>;
    categoriesCreated: number;
    channelsCreated: number;
  }> {
    logger.info({ guildId: guild.id, guildName: guild.name }, 'Starting Discord server declarative sync');

    // 1. Fetch current server state
    await guild.roles.fetch();
    await guild.channels.fetch();

    // 2. Sync Roles
    const rolesMap: Record<string, string> = {};
    for (const roleDef of DECLARATIVE_SERVER_CONFIG.roles) {
      let role = guild.roles.cache.find((r) => r.name === roleDef.name);

      const expectedPermissions = new PermissionsBitField(roleDef.permissions);

      if (!role) {
        logger.info({ roleName: roleDef.name }, 'Creating missing role');
        role = await guild.roles.create({
          name: roleDef.name,
          color: roleDef.color,
          hoist: roleDef.hoist ?? false,
          mentionable: roleDef.mentionable ?? false,
          permissions: expectedPermissions,
          reason: 'Aducti Labs Server Declarative Sync',
        });
      } else {
        // Update role properties if needed
        const needsUpdate =
          role.color !== roleDef.color ||
          role.hoist !== (roleDef.hoist ?? false) ||
          role.mentionable !== (roleDef.mentionable ?? false) ||
          !role.permissions.equals(expectedPermissions);

        if (needsUpdate) {
          logger.info({ roleName: roleDef.name }, 'Updating role attributes/permissions');
          role = await role.edit({
            color: roleDef.color,
            hoist: roleDef.hoist ?? false,
            mentionable: roleDef.mentionable ?? false,
            permissions: expectedPermissions,
            reason: 'Aducti Labs Server Declarative Sync',
          });
        }
      }

      rolesMap[roleDef.name] = role.id;
    }

    const everyoneRoleId = guild.roles.everyone.id;
    let categoriesCreated = 0;
    let channelsCreated = 0;

    // 3. Sync Categories and their Channels
    for (let catIndex = 0; catIndex < DECLARATIVE_SERVER_CONFIG.categories.length; catIndex++) {
      const catDef = DECLARATIVE_SERVER_CONFIG.categories[catIndex];
      const expectedOverwrites = catDef.permissionOverwrites(rolesMap, everyoneRoleId);

      let category = guild.channels.cache.find(
        (ch) => ch.name === catDef.name && ch.type === ChannelType.GuildCategory
      ) as CategoryChannel | undefined;

      if (!category) {
        logger.info({ categoryName: catDef.name }, 'Creating missing category');
        category = await guild.channels.create({
          name: catDef.name,
          type: ChannelType.GuildCategory,
          position: catIndex,
          permissionOverwrites: expectedOverwrites,
          reason: 'Aducti Labs Server Declarative Sync',
        });
        categoriesCreated++;
      } else {
        // Update overwrites and position
        await category.permissionOverwrites.set(expectedOverwrites, 'Aducti Labs Server Sync');
        if (category.position !== catIndex) {
          await category.setPosition(catIndex);
        }
      }

      // 4. Sync Channels within this category
      for (let chIndex = 0; chIndex < catDef.channels.length; chIndex++) {
        const chDef = catDef.channels[chIndex];
        let channel = guild.channels.cache.find(
          (ch) => ch.name === chDef.name && ch.parentId === category?.id && ch.type === chDef.type
        );

        // If not found in parent, check if channel exists with same name and type elsewhere
        if (!channel) {
          channel = guild.channels.cache.find(
            (ch) => ch.name === chDef.name && ch.type === chDef.type
          );
        }

        const channelOverwrites = chDef.permissionOverrides
          ? chDef.permissionOverrides(rolesMap, everyoneRoleId)
          : undefined;

        const isTextBased = chDef.type === ChannelType.GuildText || chDef.type === ChannelType.GuildAnnouncement || chDef.type === ChannelType.GuildForum;

        if (!channel) {
          logger.info({ channelName: chDef.name, category: catDef.name }, 'Creating missing channel');
          const createOptions: any = {
            name: chDef.name,
            type: chDef.type,
            parent: category.id,
            position: chIndex,
            permissionOverwrites: channelOverwrites ?? expectedOverwrites,
            reason: 'Aducti Labs Server Declarative Sync',
          };
          if (isTextBased && chDef.topic) {
            createOptions.topic = chDef.topic;
          }
          if (isTextBased && chDef.rateLimitPerUser) {
            createOptions.rateLimitPerUser = chDef.rateLimitPerUser;
          }

          await guild.channels.create(createOptions);
          channelsCreated++;
        } else {
          // Channel exists, check parent, topic, position, and overrides
          const isText = channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement;
          const currentTopic = isText ? (channel as any).topic : undefined;
          const currentRateLimit = isText ? (channel as any).rateLimitPerUser : undefined;

          const updateOptions: any = {
            parent: category.id,
            position: chIndex,
            reason: 'Aducti Labs Server Declarative Sync',
          };
          if (isText && chDef.topic !== undefined) {
            updateOptions.topic = chDef.topic;
          }
          if (isText && chDef.rateLimitPerUser !== undefined) {
            updateOptions.rateLimitPerUser = chDef.rateLimitPerUser;
          }

          if (
            channel.parentId !== category.id ||
            (channel as any).position !== chIndex ||
            (isText && (currentTopic !== (chDef.topic ?? null) || currentRateLimit !== (chDef.rateLimitPerUser ?? 0)))
          ) {
            logger.info({ channelName: chDef.name }, 'Updating channel metadata');
            await (channel as any).edit(updateOptions);
          }

          if (channelOverwrites) {
            await (channel as any).permissionOverwrites.set(channelOverwrites, 'Aducti Labs Server Sync');
          }
        }
      }
    }

    logger.info(
      { categoriesCreated, channelsCreated },
      'Discord server declarative sync completed successfully'
    );

    return {
      rolesMap,
      categoriesCreated,
      channelsCreated,
    };
  }
}
