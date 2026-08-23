import {
  EmbedBuilder,
  type Guild,
  type TextChannel,
  type User as DiscordUser,
} from 'discord.js';
import { CHANNEL_NAMES, EMBED_COLORS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export class DiscordLogger {
  private static findLogsChannel(guild: Guild): TextChannel | null {
    const channel = guild.channels.cache.find(
      (ch) => ch.name === CHANNEL_NAMES.LOGS && ch.isTextBased()
    );
    return (channel as TextChannel) || null;
  }

  static async logMemberOnboarded(guild: Guild, user: DiscordUser) {
    const channel = this.findLogsChannel(guild);
    if (!channel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.SUCCESS)
        .setTitle('✅ Labs Member Asignado')
        .setDescription(`El usuario <@${user.id}> ha completado el onboarding en #bienvenida.`)
        .addFields(
          { name: 'Usuario', value: `${user.tag} (\`${user.id}\`)`, inline: true },
          { name: 'Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      logger.error({ err }, 'Failed to send log to Discord #logs channel');
    }
  }

  static async logProActivated(
    guild: Guild,
    user: { id: string; tag: string },
    details: { plan: string; priceId: string; subscriptionId: string }
  ) {
    const channel = this.findLogsChannel(guild);
    if (!channel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.PRIMARY)
        .setTitle('⭐ Suscripción PRO Activada')
        .setDescription(`Se ha activado el acceso PRO para <@${user.id}>.`)
        .addFields(
          { name: 'Usuario', value: `${user.tag} (\`${user.id}\`)`, inline: true },
          { name: 'Plan', value: `\`${details.plan.toUpperCase()}\``, inline: true },
          { name: 'Suscripción Stripe', value: `\`${details.subscriptionId}\``, inline: false }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      logger.error({ err }, 'Failed to send log to Discord #logs channel');
    }
  }

  static async logFounderActivated(
    guild: Guild,
    user: { id: string; tag: string },
    details: { subscriptionId: string }
  ) {
    const channel = this.findLogsChannel(guild);
    if (!channel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.FOUNDER)
        .setTitle('🏆 Labs Founder Activado')
        .setDescription(`¡Nuevo miembro fundador histórico! <@${user.id}> ha obtenido el rol **Labs Founder**.`)
        .addFields(
          { name: 'Usuario', value: `${user.tag} (\`${user.id}\`)`, inline: true },
          { name: 'Suscripción Stripe', value: `\`${details.subscriptionId}\``, inline: false }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      logger.error({ err }, 'Failed to send log to Discord #logs channel');
    }
  }

  static async logProRemoved(
    guild: Guild,
    user: { id: string; tag: string },
    reason: string
  ) {
    const channel = this.findLogsChannel(guild);
    if (!channel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.DANGER)
        .setTitle('❌ Suscripción PRO Terminada')
        .setDescription(`Se ha retirado el rol **Labs Pro** a <@${user.id}>.`)
        .addFields(
          { name: 'Usuario', value: `${user.tag} (\`${user.id}\`)`, inline: true },
          { name: 'Motivo', value: reason, inline: true }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      logger.error({ err }, 'Failed to send log to Discord #logs channel');
    }
  }

  static async logPaymentFailed(
    guild: Guild,
    user: { id: string; tag: string } | null,
    details: { invoiceId: string; amount?: number; currency?: string }
  ) {
    const channel = this.findLogsChannel(guild);
    if (!channel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.WARNING)
        .setTitle('⚠️ Pago Fallido en Stripe')
        .setDescription(
          user
            ? `Falló el cobro recurrente para el usuario <@${user.id}> (${user.tag}).`
            : `Falló un cobro recurrente en Stripe (usuario no identificado en DB).`
        )
        .addFields(
          { name: 'Factura Stripe', value: `\`${details.invoiceId}\``, inline: true },
          { name: 'Importe', value: details.amount ? `${(details.amount / 100).toFixed(2)} ${details.currency?.toUpperCase()}` : 'N/A', inline: true }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      logger.error({ err }, 'Failed to send log to Discord #logs channel');
    }
  }

  static async logReconciliation(
    guild: Guild,
    summary: { checked: number; rolesAdded: number; rolesRemoved: number; errors: number }
  ) {
    const channel = this.findLogsChannel(guild);
    if (!channel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.PRIMARY)
        .setTitle('🔄 Reconciliación de Servidor Ejecutada')
        .setDescription('Se ha completado la auditoría y sincronización entre DB, Stripe y Discord.')
        .addFields(
          { name: 'Usuarios auditados', value: `${summary.checked}`, inline: true },
          { name: 'Roles asignados', value: `+${summary.rolesAdded}`, inline: true },
          { name: 'Roles retirados', value: `-${summary.rolesRemoved}`, inline: true },
          { name: 'Errores', value: `${summary.errors}`, inline: true }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      logger.error({ err }, 'Failed to send log to Discord #logs channel');
    }
  }

  static async logError(guild: Guild, title: string, message: string) {
    const channel = this.findLogsChannel(guild);
    if (!channel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.DANGER)
        .setTitle(`⚠️ ${title}`)
        .setDescription(message.slice(0, 2000))
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      logger.error({ err }, 'Failed to send error log to Discord #logs channel');
    }
  }
}
