import { pino } from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.token',
      'body.secret',
      '*.DISCORD_BOT_TOKEN',
      '*.DISCORD_CLIENT_SECRET',
      '*.STRIPE_SECRET_KEY',
      '*.STRIPE_WEBHOOK_SECRET',
      '*.SESSION_SECRET',
    ],
    censor: '***REDACTED***',
  },
});
