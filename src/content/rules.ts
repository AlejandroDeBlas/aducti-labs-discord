import { EmbedBuilder } from 'discord.js';
import { EMBED_COLORS } from '../config/constants.js';

export function getRulesEmbed() {
  return new EmbedBuilder()
    .setColor(EMBED_COLORS.PRIMARY)
    .setTitle('📜 Normas de la Comunidad')
    .setDescription(
      'Para mantener Aducti Labs como un espacio de alto valor técnico y profesional, seguimos estas normas básicas:'
    )
    .addFields(
      {
        name: '1. Respeto y Profesionalidad',
        value: 'Trata a los demás miembros con respeto constructivo. El debate técnico es bienvenido; la toxicidad, no.',
        inline: false,
      },
      {
        name: '2. Cero Spam y Autopromoción No Solicitada',
        value: 'No envíes mensajes privados no solicitados con ofertas comerciales ni publiques enlaces de afiliados o spam en canales públicos.',
        inline: false,
      },
      {
        name: '3. Utiliza el Canal Adecuado',
        value:
          'Publica cada tema en su canal correspondiente (`#coding-con-ia`, `#automatizaciones`, `#modelos-y-herramientas`, `#proyectos`, `#preguntas`).',
        inline: false,
      },
      {
        name: '4. Comparte Valor y Proyectos Reales',
        value:
          'Fomentamos compartir código, dudas concretas, soluciones, demos y aprendizajes prácticos que aporten a toda la comunidad.',
        inline: false,
      }
    )
    .setFooter({ text: 'Aducti Labs • Normas de Convivencia' });
}
