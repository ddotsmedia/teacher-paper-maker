import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@tpm/database';
import { registerUser } from '../../apps/web/src/server/auth-service';
import { getTeacherProfile, updateTeacherProfile } from '../../apps/web/src/server/teacher-service';
import { resetDatabase } from '../helpers/db';

async function seedUser() {
  await registerUser({ email: 'prof@example.com', name: 'Prof', password: 'Password1' });
  return prisma.user.findUniqueOrThrow({ where: { email: 'prof@example.com' } });
}

describe('teacher profile', () => {
  beforeEach(resetDatabase);

  it('updates the profile and reads it back', async () => {
    const user = await seedUser();

    const saved = await updateTeacherProfile(user.id, {
      schoolName: 'Springfield',
      preferredCurriculum: 'IB',
      preferredGrades: ['5', '6'],
      preferredSubjects: ['Science'],
    });

    expect(saved.schoolName).toBe('Springfield');
    expect(saved.preferredCurriculum).toBe('IB');
    expect(saved.preferredGrades).toEqual(['5', '6']);

    const fetched = await getTeacherProfile(user.id);
    expect(fetched?.preferredSubjects).toEqual(['Science']);
  });

  it('is idempotent (upsert) across repeated saves', async () => {
    const user = await seedUser();
    await updateTeacherProfile(user.id, { schoolName: 'First' });
    await updateTeacherProfile(user.id, { schoolName: 'Second' });

    const profiles = await prisma.teacherProfile.findMany({ where: { userId: user.id } });
    expect(profiles).toHaveLength(1);
    expect(profiles[0]?.schoolName).toBe('Second');
  });
});
