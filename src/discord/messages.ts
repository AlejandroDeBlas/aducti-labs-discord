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
   * Posts or updates the welcome, how-it-works, and rules embeds in #bienvenida
   */
  static async syncWelcomeMessage(guild: Guild) {
    const channel = guild.channels.cache.find(
      (ch) => ch.name === CHANNEL_NAMES.BIENVENIDA && ch.isTextBased()
    ) as TextChannel | undefined;

    if (!channel) {
      logger.warn('Channel #bienvenida not found, skipping welcome message sync');
      return;
    }

    const { embed: welcomeEmbed, row } = getWelcomeMessage();
    const howItWorksEmbed = getHowItWorksEmbed();
    const rulesEmbed = getRulesEmbed();

    const embeds = [welcomeEmbed, howItWorksEmbed, rulesEmbed];

    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const existingBotMessage = messages.find(
        (m) => m.author.id === guild.client.user?.id
      );

      if (existingBotMessage) {
        await existingBotMessage.edit({ embeds, components: [row] });
        logger.info('Updated existing welcome, how-it-works and rules message in #bienvenida');
      } else {
        await channel.send({ embeds, components: [row] });
        logger.info('Sent new welcome, how-it-works and rules message in #bienvenida');
      }
    } catch (err) {
      logger.error({ err }, 'Failed to sync welcome message in #bienvenida');
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
}
