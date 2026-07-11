import { prisma } from '@tpm/database';
import type { TeacherProfileInput } from '@tpm/schemas';

export interface TeacherProfileDto {
  schoolName: string | null;
  preferredCurriculum: string | null;
  preferredGrades: string[];
  preferredSubjects: string[];
}

/** Create or update the authenticated teacher's profile. */
export async function updateTeacherProfile(
  userId: string,
  input: TeacherProfileInput,
): Promise<TeacherProfileDto> {
  const data = {
    schoolName: input.schoolName ?? null,
    preferredCurriculum: input.preferredCurriculum ?? null,
    preferredGrades: input.preferredGrades ?? [],
    preferredSubjects: input.preferredSubjects ?? [],
  };

  const profile = await prisma.teacherProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    select: {
      schoolName: true,
      preferredCurriculum: true,
      preferredGrades: true,
      preferredSubjects: true,
    },
  });

  return profile;
}

export async function getTeacherProfile(userId: string): Promise<TeacherProfileDto | null> {
  return prisma.teacherProfile.findUnique({
    where: { userId },
    select: {
      schoolName: true,
      preferredCurriculum: true,
      preferredGrades: true,
      preferredSubjects: true,
    },
  });
}
