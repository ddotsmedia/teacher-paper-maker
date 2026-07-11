import { prisma } from '@tpm/database';
import type { RegisterInput } from '@tpm/schemas';
import { getEnv } from '@tpm/config';
import { hashPassword } from '../lib/password';
import { generateToken, hashToken, tokenExpiry } from '../lib/tokens';
import { HttpError } from '../lib/http';
import { sendMail } from '../lib/mailer';
import { welcomeEmail } from '../emails/welcome';
import { resetPasswordEmail } from '../emails/reset-password';

/** Create a user + empty teacher profile, then send the welcome email. */
export async function registerUser(input: RegisterInput): Promise<{ id: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError('Email already registered', 400);
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      profile: { create: {} },
    },
    select: { id: true, name: true, email: true },
  });

  const env = getEnv();
  const email = welcomeEmail({ name: user.name ?? 'there', loginUrl: `${env.APP_URL}/auth/login` });
  await sendMail({ to: user.email, ...email });

  return { id: user.id };
}

/**
 * Issue a password-reset token and email the link. Always resolves without
 * revealing whether the email exists.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) return;

  // Invalidate any outstanding tokens for this user.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = generateToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: tokenExpiry(),
    },
  });

  const env = getEnv();
  const message = resetPasswordEmail({
    resetUrl: `${env.APP_URL}/auth/reset-password/${token}`,
  });
  await sendMail({ to: user.email, ...message });
}

/** Confirm a reset: validate the token, set the new password, invalidate tokens. */
export async function confirmPasswordReset(token: string, password: string): Promise<void> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    throw new HttpError('Token invalid or expired', 400);
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);
}
