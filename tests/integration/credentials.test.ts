import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@tpm/database';
import { registerUser } from '../../apps/web/src/server/auth-service';
import { validateCredentials } from '../../apps/web/src/server/credentials';
import { resetDatabase } from '../helpers/db';

describe('validateCredentials', () => {
  beforeEach(resetDatabase);

  it('authenticates a valid email + password', async () => {
    await registerUser({ email: 'login@example.com', name: 'Login', password: 'Password1' });
    const user = await validateCredentials({ email: 'login@example.com', password: 'Password1' });
    expect(user?.email).toBe('login@example.com');
  });

  it('returns null for a wrong password', async () => {
    await registerUser({ email: 'login@example.com', name: 'Login', password: 'Password1' });
    expect(await validateCredentials({ email: 'login@example.com', password: 'nope' })).toBeNull();
  });

  it('returns null for an unknown user', async () => {
    expect(
      await validateCredentials({ email: 'ghost@example.com', password: 'Password1' }),
    ).toBeNull();
  });

  it('returns null for an OAuth-only account (no password hash)', async () => {
    await prisma.user.create({ data: { email: 'oauth@example.com', name: 'OAuth' } });
    expect(
      await validateCredentials({ email: 'oauth@example.com', password: 'Password1' }),
    ).toBeNull();
  });

  it('returns null for malformed input', async () => {
    expect(await validateCredentials({ email: 'bad', password: '' })).toBeNull();
    expect(await validateCredentials(null)).toBeNull();
  });
});
