import { prisma } from '@tpm/database';

/** Truncate all Phase 1 tables between tests for isolation. */
export async function resetDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany(),
    prisma.document.deleteMany(),
    prisma.teacherProfile.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
