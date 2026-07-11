import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@tpm/database';
import { registerUser } from '../../apps/web/src/server/auth-service';
import { validateCredentials } from '../../apps/web/src/server/credentials';
import { HttpError } from '../../apps/web/src/lib/http';
import { resetDatabase } from '../helpers/db';

describe('registerUser', () => {
  beforeEach(resetDatabase);

  it('creates a user with an empty profile and a hashed password', async () => {
    await registerUser({ email: 'ada@example.com', name: 'Ada', password: 'Password1' });

    const user = await prisma.user.findUnique({
      where: { email: 'ada@example.com' },
      include: { profile: true },
    });

    expect(user).not.toBeNull();
    expect(user?.profile).not.toBeNull();
    expect(user?.passwordHash).toBeTruthy();
    expect(user?.passwordHash).not.toBe('Password1');
  });

  it('lets the new user authenticate with their password', async () => {
    await registerUser({ email: 'grace@example.com', name: 'Grace', password: 'Password1' });

    const ok = await validateCredentials({ email: 'grace@example.com', password: 'Password1' });
    expect(ok?.email).toBe('grace@example.com');

    const bad = await validateCredentials({ email: 'grace@example.com', password: 'wrong' });
    expect(bad).toBeNull();
  });

  it('rejects a duplicate email', async () => {
    await registerUser({ email: 'dup@example.com', name: 'First', password: 'Password1' });
    await expect(
      registerUser({ email: 'dup@example.com', name: 'Second', password: 'Password1' }),
    ).rejects.toBeInstanceOf(HttpError);
  });
});
