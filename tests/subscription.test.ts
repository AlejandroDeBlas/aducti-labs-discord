import { describe, it, expect } from 'vitest';
import { SubscriptionService } from '../src/services/subscription.service.js';

describe('Subscription Service Business Logic', () => {
  it('should mark active or trialing subscriptions as active', () => {
    expect(SubscriptionService.isSubscriptionActive({ status: 'active' })).toBe(true);
    expect(SubscriptionService.isSubscriptionActive({ status: 'trialing' })).toBe(true);
  });

  it('should mark past_due, canceled, unpaid as inactive if no future period', () => {
    expect(SubscriptionService.isSubscriptionActive({ status: 'past_due' })).toBe(false);
    expect(SubscriptionService.isSubscriptionActive({ status: 'canceled' })).toBe(false);
    expect(SubscriptionService.isSubscriptionActive({ status: 'unpaid' })).toBe(false);
  });

  it('should retain active access if cancel_at_period_end is true and currentPeriodEnd is in future', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days in future
    expect(
      SubscriptionService.isSubscriptionActive({
        status: 'canceled',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: futureDate,
      })
    ).toBe(true);
  });

  it('should revoke active access if cancel_at_period_end is true but currentPeriodEnd is in past', () => {
    const pastDate = new Date(Date.now() - 1000); // 1 second ago
    expect(
      SubscriptionService.isSubscriptionActive({
        status: 'canceled',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: pastDate,
      })
    ).toBe(false);
  });
});
