export const ROLE_NAMES = {
  OWNER: '👑 Owner',
  BOT: '🤖 Bot',
  MODERATOR: '🛡️ Moderador',
  FOUNDER: '🏆 Labs Founder',
  PRO: '⭐ Labs Pro',
  MEMBER: '👤 Labs Member',
} as const;

export const CATEGORY_NAMES = {
  START_HERE: '📌 EMPIEZA AQUÍ',
  COMMUNITY: '💬 COMUNIDAD',
  AI: '🤖 IA',
  RESOURCES: '🎁 RECURSOS',
  LABS_PRO: '⭐ LABS PRO',
  STAFF: '🔒 STAFF',
} as const;

export const CHANNEL_NAMES = {
  // 📌 EMPIEZA AQUÍ
  BIENVENIDA: 'bienvenida',
  ANUNCIOS: 'anuncios',
  HAZTE_PRO: 'hazte-pro',

  // 💬 COMUNIDAD
  GENERAL: 'general',
  PREGUNTAS: 'preguntas',
  PROYECTOS: 'proyectos',

  // 🤖 IA
  CODING_CON_IA: 'coding-con-ia',
  AUTOMATIZACIONES: 'automatizaciones',
  MODELOS_HERRAMIENTAS: 'modelos-y-herramientas',

  // 🎁 RECURSOS
  RECURSOS_GRATIS: 'recursos-gratis',

  // ⭐ LABS PRO
  CLASES: 'clases',
  RECURSOS_PRO: 'recursos-pro',
  DUDAS_PRO: 'dudas-pro',
  PROYECTOS_PRO: 'proyectos-pro',
  SALA_PRO: 'sala-pro',

  // 🔒 STAFF
  LOGS: 'logs',
} as const;

export const INTERACTION_IDS = {
  ONBOARDING_JOIN: 'onboarding_join_aducti_labs',
  CHECKOUT_PRO: 'checkout_pro_button',
  CHECKOUT_FOUNDER: 'checkout_founder_button',
} as const;

export const EMBED_COLORS = {
  PRIMARY: 0x0066ff,
  PRO: 0xf59e0b,
  FOUNDER: 0xf59e0b,
  SUCCESS: 0x10b981,
  WARNING: 0xf59e0b,
  DANGER: 0xef4444,
  NEUTRAL: 0x2b2d31,
} as const;
