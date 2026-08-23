import {
  type ButtonInteraction,
  type StringSelectMenuInteraction,
  type GuildMember,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { ROLE_NAMES, EMBED_COLORS } from '../config/constants.js';
import { UserService } from '../services/user.service.js';
import { AnalyticsService } from '../services/analytics.service.js';
import { DiscordLogger } from './logger.js';
import { ONBOARDING_QUESTIONS } from '../content/onboarding.js';
import { logger } from '../utils/logger.js';

export class OnboardingHandler {
  /**
   * Initial join button click in #bienvenida
   */
  static async handleJoinInteraction(interaction: ButtonInteraction) {
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({
        content: 'Esta interacción solo puede ejecutarse dentro del servidor de Discord.',
        ephemeral: true,
      });
      return;
    }

    const member = interaction.member as GuildMember;
    const memberRole = interaction.guild.roles.cache.find(
      (r) => r.name === ROLE_NAMES.MEMBER
    );

    if (!memberRole) {
      logger.error('Member role not found during onboarding interaction');
      await interaction.reply({
        content: 'Error de configuración: no se encontró el rol de miembro. Contacta con un administrador.',
        ephemeral: true,
      });
      return;
    }

    try {
      // 1. Assign role immediately (No friction / Non-blocking)
      if (!member.roles.cache.has(memberRole.id)) {
        await member.roles.add(memberRole);
      }

      // 2. Persist in DB
      const user = await UserService.upsertUser({
        discordUserId: member.user.id,
        discordUsername: member.user.username,
        discordGlobalName: member.user.globalName,
      });

      await UserService.updateRoleState(user.id, {
        memberRole: true,
      });

      // 3. Track analytics event
      await AnalyticsService.trackEvent('labs_member_activated', {
        userId: user.id,
        discordUserId: member.user.id,
      });

      // 4. Send structured log to #logs
      await DiscordLogger.logMemberOnboarded(interaction.guild, member.user);

      // 5. Present Question 1 (Interests) + Skip button
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.PRIMARY)
        .setTitle('✅ ¡Bienvenido a Aducti Labs!')
        .setDescription(
          `Ya tienes acceso completo a todos los canales gratuitos de la comunidad (` +
          `\`💬 COMUNIDAD\`, \`🤖 IA\` y \`🎁 RECURSOS\`).\n\n` +
          `**Para personalizar tu experiencia (opcional, 10 segundos):**\n` +
          `¿Qué área te interesa más explorar?`
        );

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(ONBOARDING_QUESTIONS.INTERESTS.id)
        .setPlaceholder(ONBOARDING_QUESTIONS.INTERESTS.placeholder)
        .addOptions(
          ONBOARDING_QUESTIONS.INTERESTS.options.map((opt) => ({
            label: opt.label,
            value: opt.value,
            description: opt.description,
            emoji: opt.emoji,
          }))
        );

      const skipButton = new ButtonBuilder()
        .setCustomId('onboarding_skip')
        .setLabel('Saltar e ir a la comunidad')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(skipButton);

      await interaction.reply({
        embeds: [embed],
        components: [row1, row2],
        ephemeral: true,
      });

      logger.info(
        { discordUserId: member.user.id, username: member.user.username },
        'Onboarding step 1 initiated successfully'
      );
    } catch (err) {
      logger.error({ err, userId: member.user.id }, 'Failed to complete onboarding for member');
      await interaction.reply({
        content: 'Hubo un error al asignarte el rol. Por favor, inténtalo de nuevo en unos momentos.',
        ephemeral: true,
      });
    }
  }

  /**
   * Handles Question 1 selection (Interests)
   */
  static async handleInterestSelection(interaction: StringSelectMenuInteraction) {
    const selectedInterest = interaction.values[0];
    const discordUserId = interaction.user.id;

    try {
      const user = await UserService.getUserByDiscordId(discordUserId);
      if (user) {
        await UserService.saveOnboardingResponse(user.id, {
          primaryInterest: selectedInterest,
        });
      }

      // Present Question 2 (Profiles) + Skip button
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.PRIMARY)
        .setTitle('🎯 Paso 2 de 2: Tu perfil')
        .setDescription(
          `Genial. ¿Cuál describe mejor tu situación o rol actual para adaptar los recursos que compartimos?`
        );

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(ONBOARDING_QUESTIONS.PROFILES.id)
        .setPlaceholder(ONBOARDING_QUESTIONS.PROFILES.placeholder)
        .addOptions(
          ONBOARDING_QUESTIONS.PROFILES.options.map((opt) => ({
            label: opt.label,
            value: opt.value,
            description: opt.description,
            emoji: opt.emoji,
          }))
        );

      const skipButton = new ButtonBuilder()
        .setCustomId('onboarding_skip')
        .setLabel('Finalizar')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(skipButton);

      await interaction.update({
        embeds: [embed],
        components: [row1, row2],
      });
    } catch (err) {
      logger.error({ err, discordUserId }, 'Error handling interest selection');
    }
  }

  /**
   * Handles Question 2 selection (Profile)
   */
  static async handleProfileSelection(interaction: StringSelectMenuInteraction) {
    const selectedProfile = interaction.values[0];
    const discordUserId = interaction.user.id;

    try {
      const user = await UserService.getUserByDiscordId(discordUserId);
      if (user) {
        await UserService.saveOnboardingResponse(user.id, {
          userProfile: selectedProfile,
          completed: true,
        });

        await AnalyticsService.trackEvent('onboarding_completed', {
          userId: user.id,
          discordUserId,
          properties: {
            interest: user.primaryInterest,
            profile: selectedProfile,
            skipped: false,
          },
        });
      }

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.SUCCESS)
        .setTitle('🚀 ¡Todo listo!')
        .setDescription(
          `Tu perfil ha quedado configurado.\n\n` +
          `Pásate por <#${interaction.guild?.channels.cache.find(c => c.name === 'general')?.id}> para presentarte o echa un vistazo a <#${interaction.guild?.channels.cache.find(c => c.name === 'hazte-pro')?.id}> si buscas dar el salto a los workshops prácticos de **Labs Pro**.`
        );

      await interaction.update({
        embeds: [embed],
        components: [],
      });
    } catch (err) {
      logger.error({ err, discordUserId }, 'Error handling profile selection');
    }
  }

  /**
   * Handles Skip / Finish button
   */
  static async handleSkip(interaction: ButtonInteraction) {
    const discordUserId = interaction.user.id;

    try {
      const user = await UserService.getUserByDiscordId(discordUserId);
      if (user) {
        await UserService.saveOnboardingResponse(user.id, {
          completed: true,
        });

        await AnalyticsService.trackEvent('onboarding_completed', {
          userId: user.id,
          discordUserId,
          properties: {
            skipped: true,
          },
        });
      }

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.SUCCESS)
        .setTitle('🚀 ¡Bienvenido a Aducti Labs!')
        .setDescription(
          `Ya tienes acceso a todos los canales de la comunidad. ¡Nos vemos en \`#general\`!`
        );

      await interaction.update({
        embeds: [embed],
        components: [],
      });
    } catch (err) {
      logger.error({ err, discordUserId }, 'Error handling onboarding skip');
    }
  }
}
