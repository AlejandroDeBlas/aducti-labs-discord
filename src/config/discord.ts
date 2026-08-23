import {
  ChannelType,
  PermissionFlagsBits,
  type OverwriteResolvable,
  type ColorResolvable,
} from 'discord.js';
import { ROLE_NAMES, CATEGORY_NAMES, CHANNEL_NAMES } from './constants.js';

export interface DeclarativeRole {
  name: string;
  color?: ColorResolvable;
  hoist?: boolean;
  mentionable?: boolean;
  permissions: bigint[];
  positionIndex: number; // 0 = highest, higher index = lower in hierarchy
}

export interface DeclarativeChannel {
  name: string;
  type: ChannelType;
  topic?: string;
  rateLimitPerUser?: number; // slowmode in seconds
  // Specific permission overrides on top of category defaults
  permissionOverrides?: (roles: Record<string, string>, everyoneId: string) => OverwriteResolvable[];
}

export interface DeclarativeCategory {
  name: string;
  permissionOverwrites: (roles: Record<string, string>, everyoneId: string) => OverwriteResolvable[];
  channels: DeclarativeChannel[];
}

export interface DeclarativeServerConfig {
  roles: DeclarativeRole[];
  categories: DeclarativeCategory[];
}

export const DECLARATIVE_SERVER_CONFIG: DeclarativeServerConfig = {
  roles: [
    {
      name: ROLE_NAMES.OWNER,
      color: 0xf59e0b, // Amber Gold
      hoist: true,
      mentionable: true,
      permissions: [PermissionFlagsBits.Administrator],
      positionIndex: 1,
    },
    {
      name: ROLE_NAMES.BOT,
      color: 0x5865f2, // Blurple
      hoist: true,
      mentionable: false,
      permissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.UseApplicationCommands,
        PermissionFlagsBits.ModerateMembers,
        PermissionFlagsBits.ViewAuditLog,
      ],
      positionIndex: 2,
    },
    {
      name: ROLE_NAMES.MODERATOR,
      color: 0x10b981, // Emerald Green
      hoist: true,
      mentionable: true,
      permissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageThreads,
        PermissionFlagsBits.ModerateMembers,
        PermissionFlagsBits.ViewAuditLog,
        PermissionFlagsBits.MoveMembers,
        PermissionFlagsBits.MuteMembers,
        PermissionFlagsBits.DeafenMembers,
      ],
      positionIndex: 3,
    },
    {
      name: ROLE_NAMES.FOUNDER,
      color: 0xeab308, // Gold
      hoist: true,
      mentionable: false,
      permissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
      ],
      positionIndex: 4,
    },
    {
      name: ROLE_NAMES.PRO,
      color: 0x3b82f6, // Blue
      hoist: true,
      mentionable: false,
      permissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
      ],
      positionIndex: 5,
    },
    {
      name: ROLE_NAMES.MEMBER,
      color: 0x94a3b8, // Slate
      hoist: false,
      mentionable: false,
      permissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
      ],
      positionIndex: 6,
    },
  ],

  categories: [
    // 1. 📌 EMPIEZA AQUÍ
    {
      name: CATEGORY_NAMES.START_HERE,
      permissionOverwrites: (roles, everyoneId) => [
        {
          id: everyoneId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.CreatePrivateThreads],
        },
        {
          id: roles[ROLE_NAMES.MODERATOR],
          allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
        },
      ],
      channels: [
        {
          name: CHANNEL_NAMES.BIENVENIDA,
          type: ChannelType.GuildText,
          topic: 'Bienvenido a Aducti Labs. Lee las normas y pulsa el botón para unirte a la comunidad.',
          permissionOverrides: (roles, everyoneId) => [
            {
              id: everyoneId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions],
            },
            {
              id: roles[ROLE_NAMES.MODERATOR],
              allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
            },
          ],
        },
        {
          name: CHANNEL_NAMES.ANUNCIOS,
          type: ChannelType.GuildText,
          topic: 'Anuncios oficiales y novedades de Aducti Labs.',
          permissionOverrides: (roles, everyoneId) => [
            {
              id: everyoneId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions],
              deny: [PermissionFlagsBits.SendMessages],
            },
            {
              id: roles[ROLE_NAMES.MODERATOR],
              allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
            },
          ],
        },
        {
          name: CHANNEL_NAMES.HAZTE_PRO,
          type: ChannelType.GuildText,
          topic: 'Información y acceso a la suscripción Aducti Labs Pro.',
          permissionOverrides: (roles, everyoneId) => [
            {
              id: everyoneId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions],
            },
            {
              id: roles[ROLE_NAMES.PRO],
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: roles[ROLE_NAMES.MODERATOR],
              allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
            },
          ],
        },
      ],
    },

    // 2. 💬 COMUNIDAD
    {
      name: CATEGORY_NAMES.COMMUNITY,
      permissionOverwrites: (roles, everyoneId) => [
        {
          id: everyoneId,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: roles[ROLE_NAMES.MEMBER],
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
        },
        {
          id: roles[ROLE_NAMES.PRO],
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
        },
      ],
      channels: [
        {
          name: CHANNEL_NAMES.GENERAL,
          type: ChannelType.GuildText,
          topic: 'Conversación general sobre tecnología, desarrollo e inteligencia artificial.',
          rateLimitPerUser: 5,
        },
        {
          name: CHANNEL_NAMES.PREGUNTAS,
          type: ChannelType.GuildText,
          topic: 'Canal para dudas, preguntas técnicas y resolución colectiva de problemas.',
        },
        {
          name: CHANNEL_NAMES.PROYECTOS,
          type: ChannelType.GuildText,
          topic: 'Muestra tus proyectos, demos, prototipos y herramientas en desarrollo.',
        },
      ],
    },

    // 3. 🤖 IA
    {
      name: CATEGORY_NAMES.AI,
      permissionOverwrites: (roles, everyoneId) => [
        {
          id: everyoneId,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: roles[ROLE_NAMES.MEMBER],
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
        },
        {
          id: roles[ROLE_NAMES.PRO],
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
        },
      ],
      channels: [
        {
          name: CHANNEL_NAMES.CODING_CON_IA,
          type: ChannelType.GuildText,
          topic: 'Asistentes de código, agentes autónomos, Claude Code, Cursor, Copilot y flujos de desarrollo.',
          rateLimitPerUser: 5,
        },
        {
          name: CHANNEL_NAMES.AUTOMATIZACIONES,
          type: ChannelType.GuildText,
          topic: 'Flujos con n8n, Make, scripts, agentes y pipelines de automatización.',
          rateLimitPerUser: 5,
        },
        {
          name: CHANNEL_NAMES.MODELOS_HERRAMIENTAS,
          type: ChannelType.GuildText,
          topic: 'LLMs, modelos open source, frameworks, benchmarks y novedades de IA.',
          rateLimitPerUser: 5,
        },
      ],
    },

    // 4. 🎁 RECURSOS
    {
      name: CATEGORY_NAMES.RESOURCES,
      permissionOverwrites: (roles, everyoneId) => [
        {
          id: everyoneId,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: roles[ROLE_NAMES.MEMBER],
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
          deny: [PermissionFlagsBits.SendMessages],
        },
        {
          id: roles[ROLE_NAMES.PRO],
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
          deny: [PermissionFlagsBits.SendMessages],
        },
        {
          id: roles[ROLE_NAMES.MODERATOR],
          allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
        },
      ],
      channels: [
        {
          name: CHANNEL_NAMES.RECURSOS_GRATIS,
          type: ChannelType.GuildText,
          topic: 'Repositorios, prompts, plantillas y herramientas seleccionadas para la comunidad.',
        },
      ],
    },

    // 5. ⭐ LABS PRO
    {
      name: CATEGORY_NAMES.LABS_PRO,
      permissionOverwrites: (roles, everyoneId) => [
        {
          id: everyoneId,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: roles[ROLE_NAMES.MEMBER],
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: roles[ROLE_NAMES.PRO],
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
        },
        {
          id: roles[ROLE_NAMES.MODERATOR],
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
        },
      ],
      channels: [
        {
          name: CHANNEL_NAMES.CLASES,
          type: ChannelType.GuildText,
          topic: 'Grabaciones, directos, repositorios y material de las clases y workshops PRO.',
          permissionOverrides: (roles, everyoneId) => [
            {
              id: everyoneId,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: roles[ROLE_NAMES.PRO],
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions],
              deny: [PermissionFlagsBits.SendMessages],
            },
            {
              id: roles[ROLE_NAMES.MODERATOR],
              allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks],
            },
          ],
        },
        {
          name: CHANNEL_NAMES.RECURSOS_PRO,
          type: ChannelType.GuildText,
          topic: 'Workflows avanzados, código fuente de producción, arquitecturas y plantillas PRO.',
          permissionOverrides: (roles, everyoneId) => [
            {
              id: everyoneId,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: roles[ROLE_NAMES.PRO],
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions],
              deny: [PermissionFlagsBits.SendMessages],
            },
            {
              id: roles[ROLE_NAMES.MODERATOR],
              allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
            },
          ],
        },
        {
          name: CHANNEL_NAMES.DUDAS_PRO,
          type: ChannelType.GuildText,
          topic: 'Resolución prioritaria de dudas complejas y consultoría técnica directa para miembros PRO.',
        },
        {
          name: CHANNEL_NAMES.PROYECTOS_PRO,
          type: ChannelType.GuildText,
          topic: 'Proyectos avanzados, code reviews y colaboraciones exclusivas para miembros PRO.',
        },
        {
          name: CHANNEL_NAMES.SALA_PRO,
          type: ChannelType.GuildVoice,
          topic: 'Sala de voz y streaming para workshops en directo, coworking y sesiones PRO.',
          permissionOverrides: (roles, everyoneId) => [
            {
              id: everyoneId,
              deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
            },
            {
              id: roles[ROLE_NAMES.MEMBER],
              deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
            },
            {
              id: roles[ROLE_NAMES.PRO],
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.Stream,
                PermissionFlagsBits.UseVAD,
              ],
            },
          ],
        },
      ],
    },

    // 6. 🔒 STAFF
    {
      name: CATEGORY_NAMES.STAFF,
      permissionOverwrites: (roles, everyoneId) => [
        {
          id: everyoneId,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: roles[ROLE_NAMES.MEMBER],
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: roles[ROLE_NAMES.PRO],
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: roles[ROLE_NAMES.MODERATOR],
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        },
        {
          id: roles[ROLE_NAMES.OWNER],
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.EmbedLinks,
          ],
        },
        {
          id: roles[ROLE_NAMES.BOT],
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.EmbedLinks,
          ],
        },
      ],
      channels: [
        {
          name: CHANNEL_NAMES.LOGS,
          type: ChannelType.GuildText,
          topic: 'Auditoría y registro estructurado de eventos del bot (altas, bajas, pagos, reconciliación y errores).',
        },
      ],
    },
  ],
};
