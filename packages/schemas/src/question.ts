import { z } from 'zod';

export const QuestionTypeSchema = z.enum(['mcq', 'short', 'long', 'essay']);
export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
export const BloomLevelSchema = z.enum([
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
]);

export const QuestionSchema = z
  .object({
    id: z.string(),
    documentId: z.string(),
    type: QuestionTypeSchema,
    question: z.string().min(5, 'Question text must be at least 5 characters'),
    answerJson: z.record(z.any()),
    marks: z.number().int().positive('Marks must be positive'),
    difficulty: DifficultySchema,
    bloomLevel: BloomLevelSchema,
    displayOrder: z.number().int().nonnegative(),
    deletedAt: z.date().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export type Question = z.infer<typeof QuestionSchema>;
export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type BloomLevel = z.infer<typeof BloomLevelSchema>;
