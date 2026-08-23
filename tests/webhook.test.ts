import { describe, it, expect } from 'vitest';
import { generateOAuthState, verifyOAuthState } from '../src/utils/security.js';

describe('OAuth State & Security Verification', () => {
  it('should generate and verify valid OAuth state tokens for pro plan', () => {
    const state = generateOAuthState('pro');
    expect(state).toBeDefined();
    expect(state.includes('.')).toBe(true);

    const result = verifyOAuthState(state);
    expect(result.valid).toBe(true);
    expect(result.payload?.plan).toBe('pro');
  });

  it('should generate and verify valid OAuth state tokens for founder plan', () => {
    const state = generateOAuthState('founder');
    expect(state).toBeDefined();
    expect(state.includes('.')).toBe(true);

    const result = verifyOAuthState(state);
    expect(result.valid).toBe(true);
    expect(result.payload?.plan).toBe('founder');
  });

  it('should reject tampered payload in OAuth state tokens', () => {
    const state = generateOAuthState('pro');
    const [payload, signature] = state.split('.');
    const tampered = `${payload}xyz.${signature}`;

    const result = verifyOAuthState(tampered);
    expect(result.valid).toBe(false);
  });

  it('should reject tampered signature in OAuth state tokens', () => {
    const state = generateOAuthState('pro');
    const [payload] = state.split('.');
    const tampered = `${payload}.invalid_signature_1234567890`;

    const result = verifyOAuthState(tampered);
    expect(result.valid).toBe(false);
  });

  it('should reject malformed state strings', () => {
    expect(verifyOAuthState('malformed').valid).toBe(false);
    expect(verifyOAuthState('part1.part2.part3').valid).toBe(false);
    expect(verifyOAuthState('').valid).toBe(false);
  });
});
