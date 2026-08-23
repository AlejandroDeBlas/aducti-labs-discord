import { EmbedBuilder } from 'discord.js';
import { EMBED_COLORS } from '../config/constants.js';

export function getHowItWorksEmbed() {
  return new EmbedBuilder()
    .setColor(EMBED_COLORS.PRIMARY)
    .setTitle('Cómo Funciona Aducti Labs')
    .setDescription(
      `**Free te ayuda a descubrir y aprender. Pro te ayuda a implementar.**\n\n` +
      `Diseñamos la comunidad para separar claramente el espacio abierto de debate y aprendizaje del espacio de implementación técnica profunda.`
    )
    .addFields(
      {
        name: '🆓 Comunidad Gratuita (Descubrimiento + Comunidad)',
        value:
          '• Conversación general y resolución colaborativa de dudas.\n' +
          '• Recursos seleccionados, prompts y herramientas recomendadas.\n' +
          '• Canales temáticos sobre coding, automatización, modelos e IA.\n' +
          '• Espacio para compartir proyectos y recibir feedback.',
        inline: false,
      },
      {
        name: '⭐ Labs Pro (Implementación + Profundidad + Soporte)',
        value:
          '• **Workshops prácticos semanales** en directo con repositorios y notas.\n' +
          '• **Proyectos completos** construidos de principio a fin (SaaS, agentes, scrapers, sistemas).\n' +
          '• **Recursos avanzados y código fuente** listo para producción.\n' +
          '• **Soporte técnico prioritario** y revisión directa de proyectos en `#dudas-pro` y `🔊 sala-pro`.',
        inline: false,
      },
      {
        name: '⚡ Paso a paso',
        value:
          '1. Entra gratis y accede a la comunidad.\n' +
          '2. Participa, comparte tus avances y usa los recursos.\n' +
          '3. Cuando quieras dar el salto a la implementación práctica profunda, activa **Labs Pro** en `#hazte-pro`.',
        inline: false,
      }
    )
    .setFooter({ text: 'Aducti Labs • Claridad y Ejecución Práctica' });
}
