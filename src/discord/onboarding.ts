import { type ButtonInteraction, type GuildMember } from 'discord.js';
import { ROLE_NAMES } from '../config/constants.js';
import { UserService } from '../services/user.service.js';
import { DiscordLogger } from './logger.js';
import { logger } from '../utils/logger.js';

export class OnboardingHandler {
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

    // Check if user already has the member role
    if (member.roles.cache.has(memberRole.id)) {
      await interaction.reply({
        content: 'Ya formas parte de Aducti Labs. Tienes acceso completo a todos los canales de la comunidad.',
        ephemeral: true,
      });
      return;
    }

    try {
      // Assign role
      await member.roles.add(memberRole);

      // Persist in DB
      const user = await UserService.upsertUser({
        discordUserId: member.user.id,
        discordUsername: member.user.username,
        discordGlobalName: member.user.globalName,
      });

      await UserService.updateRoleState(user.id, {
        memberRole: true,
      });

      // Send structured log
      await DiscordLogger.logMemberOnboarded(interaction.guild, member.user);

      // Respond to user
      await interaction.reply({
        content: '✅ **¡Bienvenido a Aducti Labs!**\n\nSe han desbloqueado los canales de la comunidad (`💬 COMUNIDAD`, `🤖 IA` y `🎁 RECURSOS`). Pásate por `#general` para presentarte.',
        ephemeral: true,
      });

      logger.info(
        { discordUserId: member.user.id, username: member.user.username },
        'Onboarding completed successfully'
      );
    } catch (err) {
      logger.error({ err, userId: member.user.id }, 'Failed to complete onboarding for member');
      await interaction.reply({
        content: 'Hubo un error al asignarte el rol. Por favor, inténtalo de nuevo en unos momentos.',
        ephemeral: true,
      });
    }
  }
}
