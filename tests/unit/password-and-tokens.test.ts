import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../apps/web/src/lib/password';
import { generateToken, hashToken, tokenExpiry } from '../../apps/web/src/lib/tokens';

describe('password hashing', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('Password1');
    expect(hash).not.toBe('Password1');
    expect(await verifyPassword('Password1', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});

describe('reset tokens', () => {
  it('generates a 32-char hex token', () => {
    const token = generateToken();
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it('hashes deterministically and differs from the raw token', () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });

  it('sets expiry roughly one hour in the future', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    expect(tokenExpiry(now).getTime() - now.getTime()).toBe(60 * 60 * 1000);
  });
});
