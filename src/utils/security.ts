import crypto from 'node:crypto';
import { env } from '../config/env.js';

export interface OAuthStatePayload {
  nonce: string;
  plan: 'pro' | 'founder';
  timestamp: number;
}

export function generateOAuthState(plan: 'pro' | 'founder' = 'pro'): string {
  const payload: OAuthStatePayload = {
    nonce: crypto.randomBytes(16).toString('hex'),
    plan,
    timestamp: Date.now(),
  };

  const serialized = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', env.SESSION_SECRET)
    .update(serialized)
    .digest('base64url');

  return `${serialized}.${signature}`;
}

export function verifyOAuthState(state: string): { valid: boolean; payload?: OAuthStatePayload } {
  try {
    const parts = state.split('.');
    if (parts.length !== 2) {
      return { valid: false };
    }

    const [serialized, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', env.SESSION_SECRET)
      .update(serialized)
      .digest('base64url');

    // Timing-safe comparison
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false };
    }

    const rawPayload = Buffer.from(serialized, 'base64url').toString('utf-8');
    const payload: OAuthStatePayload = JSON.parse(rawPayload);

    // State valid for 15 minutes (900,000 ms)
    const MAX_AGE_MS = 15 * 60 * 1000;
    if (Date.now() - payload.timestamp > MAX_AGE_MS) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}
