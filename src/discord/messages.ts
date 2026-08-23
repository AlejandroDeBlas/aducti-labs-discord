import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Guild,
  type TextChannel,
} from 'discord.js';
import { CHANNEL_NAMES, EMBED_COLORS, INTERACTION_IDS } from '../config/constants.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class MessageManager {
  /**
   * Posts or updates the welcome embed in #bienvenida
   */
  static async syncWelcomeMessage(guild: Guild) {
    const channel = guild.channels.cache.find(
      (ch) => ch.name === CHANNEL_NAMES.BIENVENIDA && ch.isTextBased()
    ) as TextChannel | undefined;

    if (!channel) {
      logger.warn('Channel #bienvenida not found, skipping welcome message sync');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setTitle('Bienvenido a Aducti Labs')
      .setDescription(
        `Aducti Labs es una comunidad enfocada en **inteligencia artificial aplicada, desarrollo de software con agentes y automatización real**.\n\n` +
        `Aquí compartimos herramientas, arquitecturas, casos de uso prácticos y flujos de trabajo orientados a producción.`
      )
      .addFields(
        {
          name: '📌 Qué encontrarás en la comunidad',
          value:
            '• **Coding con IA:** Asistentes, agentes autónomos, Cursor, Claude Code y patrones de desarrollo.\n' +
            '• **Automatizaciones:** Pipelines con n8n, Make, scripts propios y workflows avanzados.\n' +
            '• **Modelos y Herramientas:** Novedades sobre LLMs, frameworks y benchmarks.\n' +
            '• **Proyectos:** Espacio para compartir proyectos propios y recibir feedback técnico.',
          inline: false,
        },
        {
          name: '⭐ Aducti Labs Pro',
          value:
            'Para miembros que buscan formación continua, workshops técnicos semanales, acceso a código fuente y soporte directo, disponemos de **Labs Pro** (consulta `#hazte-pro`).',
          inline: false,
        },
        {
          name: '🚀 Cómo empezar',
          value:
            'Haz clic en el botón inferior **"Entrar en Aducti Labs"** para obtener el rol de miembro y desbloquear todos los canales de la comunidad.',
          inline: false,
        }
      )
      .setFooter({ text: 'Aducti Labs • Comunidad de IA Práctica' });

    const button = new ButtonBuilder()
      .setCustomId(INTERACTION_IDS.ONBOARDING_JOIN)
      .setLabel('Entrar en Aducti Labs')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🚀');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const existingBotMessage = messages.find(
        (m) => m.author.id === guild.client.user?.id
      );

      if (existingBotMessage) {
        await existingBotMessage.edit({ embeds: [embed], components: [row] });
        logger.info('Updated existing welcome message in #bienvenida');
      } else {
        await channel.send({ embeds: [embed], components: [row] });
        logger.info('Sent new welcome message in #bienvenida');
      }
    } catch (err) {
      logger.error({ err }, 'Failed to sync welcome message in #bienvenida');
    }
  }

  /**
   * Posts or updates the pro promotional embed in #hazte-pro
   */
  static async syncProMessage(guild: Guild) {
    const channel = guild.channels.cache.find(
      (ch) => ch.name === CHANNEL_NAMES.HAZTE_PRO && ch.isTextBased()
    ) as TextChannel | undefined;

    if (!channel) {
      logger.warn('Channel #hazte-pro not found, skipping pro message sync');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRO)
      .setTitle('⭐ Aducti Labs Pro')
      .setDescription(
        `Eleva tus capacidades de desarrollo y automatización con IA al siguiente nivel con la suscripción **Labs Pro**.\n\n` +
        `Accede a contenido técnico avanzado, workshops prácticos semanales y soporte directo.`
      )
      .addFields(
        {
          name: '📚 Qué incluye Labs Pro',
          value:
            '• **Workshops y Clases Semanales:** Sesiones prácticas en directo sobre arquitecturas de agentes, RAG, automatizaciones complejas y código en producción.\n' +
            '• **Repositorios y Recursos Exclusivos:** Código fuente completo, prompts estructurados y plantillas listas para desplegar.\n' +
            '• **Canales Exclusivos (`#dudas-pro`, `#proyectos-pro`):** Asistencia técnica prioritaria y revisión de proyectos.\n' +
            '• **Sala de Voz PRO (`🔊 sala-pro`):** Coworking, directos y sesiones interactivas.',
          inline: false,
        },
        {
          name: '🔒 Sin Permanencia',
          value: 'Cancela en cualquier momento desde tu panel de usuario de forma inmediata y sin complicaciones.',
          inline: false,
        }
      )
      .setFooter({ text: 'Aducti Labs Pro • Acceso Inmediato' });

    const checkoutUrl = `${env.APP_URL}/auth/discord?plan=pro`;

    const button = new ButtonBuilder()
      .setLabel('Hazte Pro')
      .setStyle(ButtonStyle.Link)
      .setURL(checkoutUrl)
      .setEmoji('⭐');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const existingBotMessage = messages.find(
        (m) => m.author.id === guild.client.user?.id
      );

      if (existingBotMessage) {
        await existingBotMessage.edit({ embeds: [embed], components: [row] });
        logger.info('Updated existing pro message in #hazte-pro');
      } else {
        await channel.send({ embeds: [embed], components: [row] });
        logger.info('Sent new pro message in #hazte-pro');
      }
    } catch (err) {
      logger.error({ err }, 'Failed to sync pro message in #hazte-pro');
    }
  }
}
