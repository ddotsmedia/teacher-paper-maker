import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@tpm/database';
import {
  confirmPasswordReset,
  registerUser,
  requestPasswordReset,
} from '../../apps/web/src/server/auth-service';
import { validateCredentials } from '../../apps/web/src/server/credentials';
import { hashToken } from '../../apps/web/src/lib/tokens';
import { HttpError } from '../../apps/web/src/lib/http';
import { resetDatabase } from '../helpers/db';

async function seedUser() {
  await registerUser({ email: 'reset@example.com', name: 'Reset', password: 'Password1' });
  return prisma.user.findUniqueOrThrow({ where: { email: 'reset@example.com' } });
}

describe('password reset flow', () => {
  beforeEach(resetDatabase);

  it('creates a single reset token for a known email', async () => {
    const user = await seedUser();
    await requestPasswordReset('reset@example.com');

    const tokens = await prisma.passwordResetToken.findMany({ where: { userId: user.id } });
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.tokenHash).toHaveLength(64); // sha-256 hex
  });

  it('does nothing (and does not throw) for an unknown email', async () => {
    await expect(requestPasswordReset('nobody@example.com')).resolves.toBeUndefined();
    const count = await prisma.passwordResetToken.count();
    expect(count).toBe(0);
  });

  it('confirms a reset, updates the password, and clears the token', async () => {
    const user = await seedUser();
    // Insert a token with a known raw value.
    const raw = 'a'.repeat(32);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await confirmPasswordReset(raw, 'NewPassword9');

    expect(
      await validateCredentials({ email: 'reset@example.com', password: 'NewPassword9' }),
    ).not.toBeNull();
    expect(
      await validateCredentials({ email: 'reset@example.com', password: 'Password1' }),
    ).toBeNull();
    expect(await prisma.passwordResetToken.count({ where: { userId: user.id } })).toBe(0);
  });

  it('rejects an expired token', async () => {
    const user = await seedUser();
    const raw = 'b'.repeat(32);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    await expect(confirmPasswordReset(raw, 'NewPassword9')).rejects.toBeInstanceOf(HttpError);
  });

  it('rejects an unknown token', async () => {
    await expect(confirmPasswordReset('c'.repeat(32), 'NewPassword9')).rejects.toBeInstanceOf(
      HttpError,
    );
  });
});
