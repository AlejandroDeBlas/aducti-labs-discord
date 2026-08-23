import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { EMBED_COLORS, INTERACTION_IDS } from '../config/constants.js';

export function getWelcomeMessage() {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.PRIMARY)
    .setTitle('Aducti Labs • Comunidad de IA Práctica')
    .setDescription(
      `**La IA cambia demasiado rápido para aprenderla viendo vídeos sueltos.**\n\n` +
      `Aducti Labs es una comunidad para aprender qué herramientas, modelos y técnicas realmente importan y cómo aplicarlas en proyectos reales.`
    )
    .addFields(
      {
        name: '🧭 Qué trabajamos en la comunidad',
        value:
          '• **Coding con IA:** Asistentes de código, agentes autónomos, Cursor, Claude Code y flujos de desarrollo.\n' +
          '• **Automatizaciones:** Pipelines con APIs, n8n, Make, scripts propios y sistemas internos.\n' +
          '• **Modelos y Herramientas:** Filtrado de novedades, LLMs, modelos open-source y benchmarks.\n' +
          '• **Proyectos:** Creación, validación y feedback técnico sobre desarrollos reales.',
        inline: false,
      },
      {
        name: '🚀 Cómo empezar',
        value:
          'Haz clic en el botón inferior **"Entrar en Aducti Labs"** para obtener el rol de miembro y desbloquear todos los canales gratuitos de la comunidad.',
        inline: false,
      }
    )
    .setFooter({ text: 'Aducti Labs • Aprende lo que importa, construye cosas reales' });

  const button = new ButtonBuilder()
    .setCustomId(INTERACTION_IDS.ONBOARDING_JOIN)
    .setLabel('Entrar en Aducti Labs')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('🚀');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  return { embed, row };
}
