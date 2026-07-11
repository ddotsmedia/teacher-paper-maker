import { prisma } from '@tpm/database';
import { LoginSchema } from '@tpm/schemas';
import { verifyPassword } from '../lib/password';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

/**
 * Validate email/password credentials. Returns the user on success, or null for
 * any failure (bad input, unknown user, OAuth-only account, wrong password).
 */
export async function validateCredentials(credentials: unknown): Promise<AuthenticatedUser | null> {
  const parsed = LoginSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || user.deletedAt) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name, image: user.image };
}
