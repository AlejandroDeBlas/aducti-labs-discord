# Aducti Labs • Discord & Stripe Management System

Sistema integral, declarativo y autónomo para gestionar la comunidad de Discord de **Aducti Labs**, su onboarding interactivo, jerarquía de roles, canales, permisos, pasarela de suscripción recurrente con Stripe y reconciliación continua.

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
│  │  - Onboarding Handler   │       │  - Discord OAuth2       │  │
│  │  - Slash Commands       │       │  - Stripe Checkout      │  │
│  │  - Server Sync & Setup  │       │  - Stripe Webhooks      │  │
│  │  - Discord #logs Embeds │       │  - Healthcheck          │  │
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
4. `🏆 Labs Founder`: Rol histórico honorario (permanece de por vida).
5. `⭐ Labs Pro`: Rol funcional de acceso premium (vinculado a suscripción activa).
6. `👤 Labs Member`: Rol gratuito asignado automáticamente en el onboarding.
7. `@everyone`: Rol base con acceso restringido únicamente a canales de bienvenida y venta.

---

## 📁 Categorías y Canales Declarativos

- **📌 EMPIEZA AQUÍ**
  - `#bienvenida`: Embed institucional con botón interactivo `Entrar en Aducti Labs`.
  - `#anuncios`: Novedades oficiales de Aducti Labs (solo lectura con reacciones).
  - `#hazte-pro`: Explicación de Labs Pro con botón directo a Stripe Checkout (oculto para usuarios PRO).
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
  - `#clases`: Grabaciones, directos y material de workshops técnicos semanales.
  - `#recursos-pro`: Workflows avanzados, repositorios privados y plantillas de producción.
  - `#dudas-pro`: Consultoría técnica directa y resolución prioritaria.
  - `#proyectos-pro`: Code reviews y colaboración en proyectos avanzados.
  - `🔊 sala-pro`: Canal de voz y vídeo para coworking y clases en vivo.
- **🔒 STAFF** *(Owner, Moderador y Bot)*
  - `#logs`: Registro estructurado de eventos (altas, pagos, cancelaciones, auditoría y errores).

---

## ⚡ Flujos de Usuario

### 1. Onboarding Gratuito
1. Usuario nuevo entra al servidor con `@everyone`.
2. Solo puede ver `#bienvenida`, `#anuncios` y `#hazte-pro`.
3. Hace clic en el botón `Entrar en Aducti Labs` en `#bienvenida`.
4. El bot asigna de forma idempotente el rol `👤 Labs Member`.
5. Se desbloquean inmediatamente `💬 COMUNIDAD`, `🤖 IA` y `🎁 RECURSOS`.
6. Se registra el evento en `#logs`.

### 2. Alta PRO y Founder con Stripe
1. Usuario hace clic en `Hazte Pro` en `#hazte-pro` o visita `/checkout/pro` (o `/checkout/founder`).
2. Se inicia el flujo OAuth2 de Discord con verificación CSRF `state`.
3. El backend obtiene el `discord_user_id` verificado y crea una sesión de Stripe Checkout.
4. Tras el pago, Stripe emite el webhook `checkout.session.completed` y `customer.subscription.created`.
5. El backend valida la firma criptográfica `Stripe-Signature`, registra la idempotencia en `webhook_events`, guarda la suscripción en PostgreSQL y asigna `⭐ Labs Pro` (y `🏆 Labs Founder` si aplica).
6. Se publica un embed conmemorativo en `#logs`.

### 3. Cancelación de Suscripción
1. Si el usuario cancela su suscripción (`cancel_at_period_end = true`), **mantiene su acceso PRO** hasta que venza la fecha final pagada (`current_period_end`).
2. Cuando el periodo expira (`customer.subscription.deleted`), se retira `⭐ Labs Pro`.
3. Si el usuario tenía rol `🏆 Labs Founder`, **se conserva intacto para siempre**.
4. Se registra la baja en `#logs`.

---

## 🛠️ Scripts de Operación y Mantenimiento

```bash
# Inicialización completa (migraciones DB, roles, categorías, canales, permisos, embeds y slash commands)
npm run bootstrap

# Sincronización declarativa del servidor de Discord
npm run sync-discord

# Reconciliación y auditoría de suscripciones DB vs Stripe vs Roles Discord
npm run reconcile

# Desarrollo local con recarga en caliente
npm run dev

# Compilación TypeScript
npm run build

# Ejecución en producción
npm run start

# Pruebas unitarias con Vitest
npm test
```

---

## 🔒 Variables de Entorno

Configura estas variables en tu archivo `.env` o en las variables de entorno de Coolify:

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `NODE_ENV` | Entorno de ejecución | `production` |
| `PORT` | Puerto HTTP del servidor | `3000` |
| `HOST` | Host de escucha interna | `0.0.0.0` |
| `APP_URL` | URL pública con HTTPS | `https://community.aducti.com` |
| `DATABASE_URL` | Conexión a PostgreSQL | `postgres://user:pass@host:5432/db` |
| `DISCORD_BOT_TOKEN` | Token del Bot de Discord | `MTA...` |
| `DISCORD_CLIENT_ID` | Application ID de Discord | `123456789012345678` |
| `DISCORD_CLIENT_SECRET` | Client Secret OAuth2 de Discord | `abc...` |
| `DISCORD_GUILD_ID` | ID del servidor de Discord | `987654321098765432` |
| `DISCORD_REDIRECT_URI` | Callback OAuth2 de Discord | `https://community.aducti.com/auth/discord/callback` |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe API | `sk_live_...` (o `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Secreto del Webhook de Stripe | `whsec_...` |
| `STRIPE_PRICE_PRO_ID` | Price ID recurrente para Labs Pro | `price_123...` |
| `STRIPE_PRICE_FOUNDER_ID` | Price ID opcional para Labs Founder | `price_456...` |
| `SESSION_SECRET` | Clave criptográfica aleatoria (32+ chars) | `hex_random_string` |

---

## 🚀 Despliegue en Coolify

### 1. Crear Proyecto en Coolify
1. En Coolify, crea un nuevo proyecto: **`Aducti Labs`**.
2. Añade un entorno **`production`**.

### 2. Añadir Base de Datos PostgreSQL
1. En el proyecto, añade un nuevo recurso: **PostgreSQL**.
2. Nombre: `aducti-labs-postgres`.
3. Configura base de datos (`aducti_labs_discord`), usuario y contraseña segura.
4. Deja activada la persistencia del volumen Docker.
5. Configura backups automáticos diarios (Daily backup retention: 7 días).

### 3. Añadir Aplicación Node.js
1. Añade un recurso de tipo **Private GitHub Repository**.
2. Selecciona `AlejandroDeBlas/aducti-labs-discord` (rama `main`).
3. Tipo de construcción: **Dockerfile**.
4. Asigna las variables de entorno listadas arriba.
5. Configura el dominio público (ej. `community.aducti.com` o `labs.aducti.com`).
6. Configura Healthcheck:
   - Path: `/health`
   - Interval: `30`
   - Timeout: `5`
7. Despliega la aplicación. Las migraciones de base de datos se aplicarán automáticamente al arrancar.

### 4. Configurar Webhook en Stripe
1. Ve a [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks).
2. Añade un endpoint apuntando a `https://<tu-dominio>/webhooks/stripe`.
3. Selecciona los siguientes eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.paid`
4. Copia el Signing Secret (`whsec_...`) y colócalo en `STRIPE_WEBHOOK_SECRET` en Coolify.

---

## 🧪 Comandos Slash de Discord

- `/status`: Muestra estado de la conexión a Discord Gateway, PostgreSQL, Stripe API, miembros del servidor y suscriptores PRO activos (Requiere rol Moderador o superior).
- `/pro`: Presenta los beneficios de Labs Pro con enlace directo a la pasarela de pago.
- `/sync`: Ejecuta sincronización declarativa y reconciliación de roles en vivo (Exclusivo para el Owner).
