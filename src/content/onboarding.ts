export const ONBOARDING_QUESTIONS = {
  INTERESTS: {
    id: 'onboarding_interest_select',
    placeholder: '¿Qué área te interesa más explorar?',
    options: [
      {
        label: 'Coding con IA',
        value: 'coding_ia',
        description: 'Asistentes, agentes, Claude Code, Cursor y arquitectura',
        emoji: '💻',
      },
      {
        label: 'Automatización',
        value: 'automation',
        description: 'APIs, n8n, Make, scripts propios y sistemas internos',
        emoji: '⚡',
      },
      {
        label: 'IA Generativa',
        value: 'generative_ai',
        description: 'Vídeo, imagen, voz, avatares y generación de contenido',
        emoji: '🎨',
      },
      {
        label: 'Marketing con IA',
        value: 'marketing_ia',
        description: 'SEO, funnels, captación, lead magnets y copy',
        emoji: '📈',
      },
      {
        label: 'Modelos / IA Local',
        value: 'local_models',
        description: 'LLMs open source, Ollama, fine-tuning y benchmarks',
        emoji: '🤖',
      },
      {
        label: 'SaaS / Emprendimiento',
        value: 'saas_business',
        description: 'Creación de productos, micro-SaaS y monetización',
        emoji: '🚀',
      },
    ],
  },
  PROFILES: {
    id: 'onboarding_profile_select',
    placeholder: '¿Cuál describe mejor tu situación actual?',
    options: [
      {
        label: 'Estoy empezando',
        value: 'beginner',
        description: 'Aprendiendo las bases para aplicar IA',
        emoji: '🌱',
      },
      {
        label: 'Ya programo / Desarrollo software',
        value: 'developer',
        description: 'Desarrollador buscando acelerar con IA',
        emoji: '👨‍💻',
      },
      {
        label: 'Freelance / Agencia',
        value: 'freelance_agency',
        description: 'Ofrezco servicios y soluciones a clientes',
        emoji: '💼',
      },
      {
        label: 'Founder / Emprendedor',
        value: 'founder',
        description: 'Construyendo mi propio producto o empresa',
        emoji: '🏢',
      },
      {
        label: 'Trabajo en empresa',
        value: 'enterprise',
        description: 'Aplicando IA y automatización en mi equipo',
        emoji: '👥',
      },
      {
        label: 'Creador de contenido / Técnico',
        value: 'creator',
        description: 'Producción de contenido, canales o medios con IA',
        emoji: '🎬',
      },
    ],
  },
} as const;
