import { type Guild, type TextChannel } from 'discord.js';
import { CHANNEL_NAMES } from '../config/constants.js';
import { getWelcomeMessage } from '../content/welcome.js';
import { getHowItWorksEmbed } from '../content/howItWorks.js';
import { getRulesEmbed } from '../content/rules.js';
import { getProLandingEmbed } from '../content/pro.js';
import { SubscriptionService } from '../services/subscription.service.js';
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

    const { embed, row } = getWelcomeMessage();

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
   * Posts or updates the rules embed in #normas
   */
  static async syncRulesMessage(guild: Guild) {
    const channel = guild.channels.cache.find(
      (ch) => ch.name === CHANNEL_NAMES.NORMAS && ch.isTextBased()
    ) as TextChannel | undefined;

    if (!channel) {
      logger.warn('Channel #normas not found, skipping rules message sync');
      return;
    }

    const rulesEmbed = getRulesEmbed();

    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const existingBotMessage = messages.find(
        (m) => m.author.id === guild.client.user?.id
      );

      if (existingBotMessage) {
        await existingBotMessage.edit({ embeds: [rulesEmbed], components: [] });
        logger.info('Updated existing rules message in #normas');
      } else {
        await channel.send({ embeds: [rulesEmbed] });
        logger.info('Sent new rules message in #normas');
      }
    } catch (err) {
      logger.error({ err }, 'Failed to sync rules message in #normas');
    }
  }

  /**
   * Posts or updates the how-it-works embed in #como-funciona
   */
  static async syncHowItWorksMessage(guild: Guild) {
    const channel = guild.channels.cache.find(
      (ch) => ch.name === CHANNEL_NAMES.COMO_FUNCIONA && ch.isTextBased()
    ) as TextChannel | undefined;

    if (!channel) {
      logger.warn('Channel #como-funciona not found, skipping how-it-works message sync');
      return;
    }

    const howItWorksEmbed = getHowItWorksEmbed();

    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const existingBotMessage = messages.find(
        (m) => m.author.id === guild.client.user?.id
      );

      if (existingBotMessage) {
        await existingBotMessage.edit({ embeds: [howItWorksEmbed], components: [] });
        logger.info('Updated existing how-it-works message in #como-funciona');
      } else {
        await channel.send({ embeds: [howItWorksEmbed] });
        logger.info('Sent new how-it-works message in #como-funciona');
      }
    } catch (err) {
      logger.error({ err }, 'Failed to sync how-it-works message in #como-funciona');
    }
  }

  /**
   * Posts or updates the pro promotional landing embed in #hazte-pro
   */
  static async syncProMessage(guild: Guild) {
    const channel = guild.channels.cache.find(
      (ch) => ch.name === CHANNEL_NAMES.HAZTE_PRO && ch.isTextBased()
    ) as TextChannel | undefined;

    if (!channel) {
      logger.warn('Channel #hazte-pro not found, skipping pro message sync');
      return;
    }

    // Query real active Founder slots
    const founderStatus = await SubscriptionService.getFounderSlotsStatus();

    const { embed, row } = getProLandingEmbed({
      founderAvailable: founderStatus.isAvailable,
      founderSlotsRemaining: founderStatus.remaining,
    });

    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const existingBotMessage = messages.find(
        (m) => m.author.id === guild.client.user?.id
      );

      if (existingBotMessage) {
        await existingBotMessage.edit({ embeds: [embed], components: [row] });
        logger.info('Updated existing pro landing message in #hazte-pro');
      } else {
        await channel.send({ embeds: [embed], components: [row] });
        logger.info('Sent new pro landing message in #hazte-pro');
      }
    } catch (err) {
      logger.error({ err }, 'Failed to sync pro message in #hazte-pro');
    }
  }

  /**
   * Syncs all declarative messages in their respective channels
   */
  static async syncAllMessages(guild: Guild) {
    await this.syncWelcomeMessage(guild);
    await this.syncRulesMessage(guild);
    await this.syncHowItWorksMessage(guild);
    await this.syncProMessage(guild);
  }
}
