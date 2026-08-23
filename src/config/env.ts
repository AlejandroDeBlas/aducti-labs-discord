import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const defaultAppUrl = process.env.APP_URL || 'https://community.aducti.com';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  APP_URL: z.string().url().default(defaultAppUrl),

  // Database
  DATABASE_URL: z
    .string()
    .default('postgres://postgres:postgres_password@localhost:5432/aducti_labs_discord'),

  // Discord
  DISCORD_BOT_TOKEN: z.string().min(1, 'DISCORD_BOT_TOKEN is required'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required'),
  DISCORD_CLIENT_SECRET: z.string().min(1, 'DISCORD_CLIENT_SECRET is required'),
  DISCORD_GUILD_ID: z.string().min(1, 'DISCORD_GUILD_ID is required'),
  DISCORD_REDIRECT_URI: z
    .string()
    .url()
    .default(`${defaultAppUrl}/auth/discord/callback`),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_PRICE_PRO_ID: z.string().min(1, 'STRIPE_PRICE_PRO_ID is required'),
  STRIPE_PRICE_FOUNDER_ID: z.string().optional().default(''),

  // Security
  SESSION_SECRET: z
    .string()
    .default('3577a0a049ad19acfc21ba1e54bd5c3ae36ade875596c82c6f9b5a19036d79de'),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env;

export function getEnv(): Env {
  if (!parsedEnv) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const formattedErrors = result.error.format();
      console.error('❌ Invalid environment variables:', JSON.stringify(formattedErrors, null, 2));
      throw new Error('Invalid environment variables configuration');
    }
    parsedEnv = result.data;
  }
  return parsedEnv;
}

export const env = {
  get NODE_ENV() { return getEnv().NODE_ENV; },
  get PORT() { return getEnv().PORT; },
  get HOST() { return getEnv().HOST; },
  get APP_URL() { return getEnv().APP_URL; },
  get DATABASE_URL() { return getEnv().DATABASE_URL; },
  get DISCORD_BOT_TOKEN() { return getEnv().DISCORD_BOT_TOKEN; },
  get DISCORD_CLIENT_ID() { return getEnv().DISCORD_CLIENT_ID; },
  get DISCORD_CLIENT_SECRET() { return getEnv().DISCORD_CLIENT_SECRET; },
  get DISCORD_GUILD_ID() { return getEnv().DISCORD_GUILD_ID; },
  get DISCORD_REDIRECT_URI() { return getEnv().DISCORD_REDIRECT_URI; },
  get STRIPE_SECRET_KEY() { return getEnv().STRIPE_SECRET_KEY; },
  get STRIPE_WEBHOOK_SECRET() { return getEnv().STRIPE_WEBHOOK_SECRET; },
  get STRIPE_PRICE_PRO_ID() { return getEnv().STRIPE_PRICE_PRO_ID; },
  get STRIPE_PRICE_FOUNDER_ID() { return getEnv().STRIPE_PRICE_FOUNDER_ID; },
  get SESSION_SECRET() { return getEnv().SESSION_SECRET; },
};
