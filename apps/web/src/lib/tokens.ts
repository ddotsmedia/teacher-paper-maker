import { createHash, randomBytes } from 'node:crypto';

/** One hour, in milliseconds. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Generate a URL-safe random token (32 hex chars from 16 random bytes). */
export function generateToken(): string {
  return randomBytes(16).toString('hex');
}

/** SHA-256 hash of a token; only the hash is persisted, never the raw token. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function tokenExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + RESET_TOKEN_TTL_MS);
}
