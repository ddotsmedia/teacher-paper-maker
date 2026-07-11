import { z } from 'zod';
import { SUPPORTED_CURRICULA, SUPPORTED_GRADES, SUPPORTED_SUBJECTS } from './constants';

export const TeacherProfileSchema = z.object({
  schoolName: z.string().trim().max(200, 'School name is too long').optional(),
  preferredCurriculum: z.enum(SUPPORTED_CURRICULA).optional(),
  preferredGrades: z.array(z.enum(SUPPORTED_GRADES)).max(12).optional(),
  preferredSubjects: z.array(z.enum(SUPPORTED_SUBJECTS)).max(SUPPORTED_SUBJECTS.length).optional(),
});
export type TeacherProfileInput = z.infer<typeof TeacherProfileSchema>;
