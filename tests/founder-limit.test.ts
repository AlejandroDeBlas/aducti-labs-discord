import { describe, it, expect } from 'vitest';
import { SubscriptionService } from '../src/services/subscription.service.js';

describe('Founder Max Capacity & Scarcity Verification', () => {
  it('should evaluate founder price correctly based on env', () => {
    expect(SubscriptionService.isFounderPrice('price_founder_test_123')).toBe(true);
    expect(SubscriptionService.isFounderPrice('price_pro_test_123')).toBe(false);
  });

  it('should provide default founder slots status safely if DB is unreachable in test mode', async () => {
    const status = await SubscriptionService.getFounderSlotsStatus();
    expect(status.total).toBe(25);
    expect(status.remaining).toBeLessThanOrEqual(25);
  });
});
