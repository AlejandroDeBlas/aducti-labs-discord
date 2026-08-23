import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { EMBED_COLORS } from '../config/constants.js';
import { env } from '../config/env.js';

export interface ProContentOptions {
  founderAvailable: boolean;
  founderSlotsRemaining?: number;
  founderPriceLabel?: string;
}

export function getProLandingEmbed(options: ProContentOptions = { founderAvailable: false }) {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.PRO)
    .setTitle('⭐ Aducti Labs Pro')
    .setDescription(
      `**La IA cambia demasiado rápido para intentar seguirla a base de vídeos, tweets y herramientas sueltas.**\n\n` +
      `Labs Pro está pensado para darte una ventaja continua: ayudarte a **saber qué merece la pena aprender y convertir ese conocimiento en proyectos reales** para construir, automatizar, crear y vender mejor.`
    )
    .addFields(
      {
        name: '🎯 1. Aprende lo que importa',
        value:
          'Filtramos modelos, frameworks, herramientas y novedades. Separamos la señal del ruido técnico para que inviertas tu tiempo solo en lo que genera impacto real.',
        inline: false,
      },
      {
        name: '🛠️ 2. Construye cosas reales',
        value:
          '• **Workshops prácticos semanales:** Sesiones en directo donde construimos soluciones reales con repositorios, notas y flujos de implementación.\n' +
          '• **Proyectos completos:** Sistemas construidos de principio a fin (SaaS con IA, agentes autónomos con MCP, pipelines de automatización, integraciones de scraping y CRM).\n' +
          '• **Código de producción:** Acceso directo a repositorios completos, arquitecturas y prompts testeados.',
        inline: false,
      },
      {
        name: '🤝 3. Obtén ayuda cuando te atasques',
        value:
          'Feedback directo en tus implementaciones, resolución prioritaria de dudas complejas en `#dudas-pro`, revisión de proyectos y coworking técnico en `🔊 sala-pro`.',
        inline: false,
      },
      {
        name: '🔍 Proof of Work',
        value:
          'Aquí no enseñamos solo teoría: los workshops parten de arquitecturas, código y sistemas reales que utilizamos y ponemos a prueba en producción.',
        inline: false,
      },
      {
        name: '👤 Para quién es Labs Pro',
        value:
          'Desarrolladores, freelancers, founders, creadores técnicos y personas que construyen productos y quieren aplicar la IA a trabajo y negocio real.',
        inline: false,
      },
      {
        name: '🛡️ Garantía Simple de 7 Días',
        value:
          'Pruébalo durante 7 días. Si ves que no es para ti, solicita el reembolso de tu primer mes sin complicaciones.',
        inline: false,
      }
    );

  if (options.founderAvailable && (options.founderSlotsRemaining ?? 0) > 0) {
    embed.addFields({
      name: `🏆 Plazas Fundador (${options.founderSlotsRemaining} disponibles)`,
      value:
        `Las primeras 25 plazas de Aducti Labs cuentan con condición **Founder**:\n` +
        `• Precio congelado de por vida mientras mantengas tu suscripción.\n` +
        `• Rol histórico honorario **🏆 Labs Founder** permanente.\n` +
        `• Acceso Pro completo inmediato.`,
      inline: false,
    });
  }

  embed.setFooter({ text: 'Aducti Labs Pro • Cancela cuando quieras en 1 clic' });

  // Buttons
  const buttons: ButtonBuilder[] = [];

  const proButton = new ButtonBuilder()
    .setLabel('Hazte Pro')
    .setStyle(ButtonStyle.Link)
    .setURL(`${env.APP_URL}/auth/discord?plan=pro`)
    .setEmoji('⭐');
  buttons.push(proButton);

  if (options.founderAvailable && (options.founderSlotsRemaining ?? 0) > 0) {
    const founderButton = new ButtonBuilder()
      .setLabel(`Plaza Founder (${options.founderSlotsRemaining} restantes)`)
      .setStyle(ButtonStyle.Link)
      .setURL(`${env.APP_URL}/auth/discord?plan=founder`)
      .setEmoji('🏆');
    buttons.push(founderButton);
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

  return { embed, row };
}
