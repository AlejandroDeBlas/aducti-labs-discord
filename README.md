# Aducti Labs • Discord & Stripe Management System

Sistema integral, declarativo y autónomo para gestionar la comunidad de Discord de **Aducti Labs**, su onboarding interactivo con segmentación, jerarquía de roles, canales, permisos, pasarela de suscripción recurrente con Stripe y reconciliación continua.

---

## 🧭 Posicionamiento y Propuesta de Valor

> **"La IA cambia demasiado rápido para aprenderla viendo vídeos sueltos. Aducti Labs es una comunidad para aprender qué herramientas, modelos y técnicas realmente importan y cómo aplicarlas en proyectos reales para construir, automatizar, crear y vender mejor."**

### Los 3 Beneficios Centrales:
1. **🎯 Aprende lo que importa:** Filtrado continuo de herramientas, modelos y novedades técnicas (separamos señal de ruido).
2. **🛠️ Construye cosas reales:** Workshops semanales en directo, repositorios completos, arquitecturas, workflows y proyectos reales de principio a fin.
3. **🤝 Obtén ayuda cuando te atasques:** Feedback directo, resolución prioritaria de dudas complejas en `#dudas-pro` y coworking en `🔊 sala-pro`.

---

## 🏛️ Arquitectura General

```
                  ┌───────────────────────────────┐
                  │         Discord Guild         │
                  │   (Events, Interactions, UI)  │
                  └───────────────┬───────────────┘
                                  │ Gateway (discord.js v14)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              Aducti Labs Unified Node.js Service                │
│                                                                 │
│  ┌─────────────────────────┐       ┌─────────────────────────┐  │
│  │   Discord Bot Engine    │       │     HTTP API (Fastify)  │  │
│  │  - Onboarding & Segm.   │       │  - Discord OAuth2       │  │
│  │  - Slash Commands       │       │  - Stripe Checkout      │  │
│  │  - Server Sync & Setup  │       │  - Stripe Webhooks      │  │
│  │  - /metrics Reporting   │       │  - Healthcheck          │  │
│  │  - Discord #logs Embeds │       │  - Funnel Analytics     │  │
│  └────────────┬────────────┘       └────────────┬────────────┘  │
│               │                                 │               │
│               └────────────────┬────────────────┘               │
│                                ▼                                │
│                   Core Service / Sync Engine                    │
│                                │                                │
│                                ▼                                │
│                   Drizzle ORM / PostgreSQL                      │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ PostgreSQL (Coolify)  │
                     └───────────────────────┘
```

---

## 👑 Jerarquía de Roles de Discord

1. `👑 Owner`: Administrador absoluto.
2. `🤖 Bot`: Gestiona roles inferiores, canales, mensajes y webhooks.
3. `🛡️ Moderador`: Gestión de mensajes, hilos, timeouts y auditoría. Sin permisos destructivos.
4. `🏆 Labs Founder`: Rol histórico honorario (permanece de por vida, limitado a las primeras 25 plazas).
5. `⭐ Labs Pro`: Rol funcional de acceso premium (vinculado a suscripción activa).
6. `👤 Labs Member`: Rol gratuito asignado automáticamente en el onboarding.
7. `@everyone`: Rol base con acceso restringido únicamente a canales de bienvenida y venta.

---

## 📁 Categorías y Canales Declarativos

- **📌 EMPIEZA AQUÍ**
  - `#bienvenida`: Embed institucional con botón interactivo `🚀 Entrar en Aducti Labs`.
  - `#anuncios`: Novedades oficiales de Aducti Labs (solo lectura con reacciones).
  - `#hazte-pro`: Landing de conversión Pro con escasez real Founder (oculto para usuarios PRO).
- **💬 COMUNIDAD** *(Desbloqueado para Labs Member, Labs Pro, Founder)*
  - `#general`: Chat general de la comunidad (slowmode 5s).
  - `#preguntas`: Dudas técnicas y resolución colectiva de problemas.
  - `#proyectos`: Demos, prototipos y herramientas creadas por los miembros.
- **🤖 IA** *(Desbloqueado para Labs Member, Labs Pro, Founder)*
  - `#coding-con-ia`: Asistentes, Cursor, Claude Code, agentes y flujos de desarrollo.
  - `#automatizaciones`: Pipelines con n8n, Make, scripts propios.
  - `#modelos-y-herramientas`: LLMs, modelos open-source, frameworks y novedades.
- **🎁 RECURSOS**
  - `#recursos-gratis`: Repositorios, prompts y herramientas seleccionadas.
- **⭐ LABS PRO** *(Exclusivo para Labs Pro)*
  - `#clases`: Grabaciones, directos y material de workshops técnicos semanales y proyectos completos.
  - `#recursos-pro`: Workflows avanzados, repositorios privados y plantillas de producción.
  - `#dudas-pro`: Consultoría técnica directa y resolución prioritaria.
  - `#proyectos-pro`: Code reviews y colaboración en proyectos avanzados.
  - `🔊 sala-pro`: Canal de voz y vídeo para coworking y clases en vivo.
- **🔒 STAFF** *(Owner, Moderador y Bot)*
  - `#logs`: Registro estructurado de eventos (altas, pagos, cancelaciones, auditoría y errores).

---

## 📝 Guía Editorial: Titulación por Resultados

Todos los workshops, proyectos y recursos deben titularse orientados a **resultados y construcción real**, nunca temas teóricos abstractos:

| ❌ Título Inadecuado | ✅ Título Correcto Orientado a Resultado |
| :--- | :--- |
| *Introducción a MCP* | **Construye un agente que opere sobre tu repositorio con MCP** |
| *Automatización con APIs* | **Construye un sistema que capture y clasifique leads automáticamente** |
| *IA Generativa aplicada* | **Crea un pipeline que convierta un guion en un vídeo listo para publicar** |
| *RAG con LangChain* | **Monta un asistente que responda sobre la documentación interna de tu SaaS** |

---

## ⚡ Flujos de Usuario y Embudo de Conversión

### 1. Onboarding Gratuito con Segmentación Ligera
1. Usuario nuevo entra al servidor con `@everyone`.
2. Solo puede ver `#bienvenida`, `#anuncios` y `#hazte-pro`.
3. Hace clic en el botón `🚀 Entrar en Aducti Labs` en `#bienvenida`.
4. El bot asigna de forma inmediata e idempotente el rol `👤 Labs Member` (sin bloqueo).
5. Se presenta un menú desplegable de 2 preguntas rápidas (opcional):
   - **Interés principal:** Coding con IA, Automatización, IA Generativa, Marketing con IA, Modelos / IA local, SaaS.
   - **Perfil / Situación:** Principiante, Programador, Freelance/Agencia, Founder, Empresa, Creador.
6. Las respuestas se persisten en PostgreSQL y se registra el evento `onboarding_completed`.

### 2. Alta PRO y Founder con Stripe
1. Usuario hace clic en `Hazte Pro` o `Plaza Founder` en `#hazte-pro` (o visita `/checkout/pro` / `/checkout/founder`).
2. Se registra el evento `pro_cta_clicked` o `founder_cta_clicked`.
3. Si solicita Founder, el sistema valida que queden plazas disponibles (`< FOUNDER_MAX_MEMBERS`). Si se han agotado las 25 plazas, se redirige a Pro normal.
4. Tras la autenticación OAuth2 de Discord, se genera la sesión de Stripe Checkout y se registra `checkout_started`.
5. Tras el pago confirmado por webhook:
   - Se registra `checkout_completed` y `subscription_activated`.
   - Se asigna `⭐ Labs Pro` (y `🏆 Labs Founder` si aplica).
   - Se publica embed conmemorativo en `#logs`.

### 3. Cancelación de Suscripción y Garantía de 7 Días
1. Si el usuario cancela en Stripe (`cancel_at_period_end = true`), mantiene acceso Pro hasta que finalice la fecha pagada (`current_period_end`).
2. Cuando el periodo expira, se retira `⭐ Labs Pro` y se registra `subscription_ended`.
3. **Preservación Histórica:** Si el usuario obtuvo el rol `🏆 Labs Founder`, **se conserva intacto de por vida**.

#### 🛡️ Gestión Manual de Reembolsos en Stripe:
Si un usuario solicita reembolso dentro de la garantía de 7 días:
1. Entra a [Stripe Dashboard → Pagos](https://dashboard.stripe.com/payments).
2. Busca el cliente o la transacción correspondiente.
3. Haz clic en **Reembolsar** (Refund).
4. Cancela la suscripción en la pestaña de Suscripciones. El webhook procesará la baja y actualizará los roles en Discord de forma automática.

---

## 🔮 Futuro Seam: Canal `#wins`

Cuando la comunidad alcance un volumen crítico de actividad y miembros activos, se podrá añadir el canal:
- `#wins` dentro de `💬 COMUNIDAD` para compartir lanzamientos de productos, primeros clientes conseguidos, automatizaciones desplegadas en producción y resultados reales de los miembros.

---

## 🛠️ Scripts de Operación y Comandos Slash

```bash
# Inicialización completa (migraciones DB, roles, categorías, canales, permisos, embeds y slash commands)
npm run bootstrap

# Sincronización declarativa del servidor de Discord
npm run sync-discord

# Reconciliación y auditoría de suscripciones DB vs Stripe vs Roles Discord
npm run reconcile

# Pruebas unitarias con Vitest
npm test
```

### Comandos Slash:
- `/metrics` *(Solo Owner)*: Informe completo de métricas del embudo, activación, altas Pro, slots Founder y distribución de perfiles de la comunidad.
- `/status` *(Moderadores y Owner)*: Estado operativo de Discord Gateway, PostgreSQL, Stripe API y recuento de suscriptores.
- `/pro`: Presenta los 3 beneficios centrales con enlace directo al checkout.
- `/sync` *(Solo Owner)*: Sincronización forzada de estructura y reconciliación en vivo.
