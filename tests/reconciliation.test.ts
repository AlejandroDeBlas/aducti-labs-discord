import { describe, it, expect, beforeAll } from 'vitest';

describe('Founder and Pro Access Preservation Logic', () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = 'test_secret_key_1234567890123456';
    process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/test';
    process.env.DISCORD_BOT_TOKEN = 'test_token';
    process.env.DISCORD_CLIENT_ID = '123456789';
    process.env.DISCORD_CLIENT_SECRET = 'test_secret';
    process.env.DISCORD_GUILD_ID = '123456789';
    process.env.DISCORD_REDIRECT_URI = 'http://localhost:3000/auth/discord/callback';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    process.env.STRIPE_PRICE_PRO_ID = 'price_pro_123';
    process.env.STRIPE_PRICE_FOUNDER_ID = 'price_founder_123';
  });

  it('should identify founder price correctly', async () => {
    const { SubscriptionService } = await import('../src/services/subscription.service.js');

    expect(SubscriptionService.isFounderPrice('price_founder_123')).toBe(true);
    expect(SubscriptionService.isFounderPrice('price_pro_123')).toBe(false);
  });
});
