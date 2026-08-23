import type { FastifyPluginAsync } from 'fastify';
import { SubscriptionService } from '../../services/subscription.service.js';

export const checkoutRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/checkout/pro', async (_req, reply) => {
    return reply.redirect('/auth/discord?plan=pro');
  });

  fastify.get('/checkout/founder', async (_req, reply) => {
    const founderStatus = await SubscriptionService.getFounderSlotsStatus();
    if (!founderStatus.isAvailable) {
      return reply.redirect('/auth/discord?plan=pro');
    }
    return reply.redirect('/auth/discord?plan=founder');
  });

  fastify.get('/checkout/success', async (_req, reply) => {
    return reply.type('text/html').send(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>¡Suscripción Confirmada! • Aducti Labs</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            body { background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
            .icon { font-size: 48px; margin-bottom: 20px; }
            h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #f8fafc; }
            p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
            .btn { display: inline-block; background: #0066ff; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 8px; transition: background 0.2s; }
            .btn:hover { background: #0052cc; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⭐</div>
            <h1>¡Pago completado con éxito!</h1>
            <p>Tu suscripción se ha procesado correctamente. En breves segundos tus roles y canales PRO estarán desbloqueados en el servidor de Discord.</p>
            <a href="https://discord.com/app" class="btn">Volver a Discord</a>
          </div>
        </body>
      </html>
    `);
  });

  fastify.get('/checkout/canceled', async (_req, reply) => {
    return reply.type('text/html').send(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Checkout Cancelado • Aducti Labs</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            body { background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; }
            .icon { font-size: 48px; margin-bottom: 20px; }
            h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #f8fafc; }
            p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
            .btn { display: inline-block; background: #334155; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 8px; }
            .btn:hover { background: #475569; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">ℹ️</div>
            <h1>Proceso no completado</h1>
            <p>Has cancelado el proceso de pago. Puedes volver al servidor de Discord o iniciar la suscripción cuando lo desees.</p>
            <a href="https://discord.com/app" class="btn">Volver a Discord</a>
          </div>
        </body>
      </html>
    `);
  });
};
