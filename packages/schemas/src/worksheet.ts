import { z } from 'zod';
import { SUPPORTED_CURRICULA, SUPPORTED_GRADES, SUPPORTED_SUBJECTS } from './constants';

export const DifficultyDistributionSchema = z
  .object({
    easyPercent: z.number().int().min(0).max(100),
    mediumPercent: z.number().int().min(0).max(100),
    hardPercent: z.number().int().min(0).max(100),
  })
  .refine((d) => d.easyPercent + d.mediumPercent + d.hardPercent === 100, {
    message: 'Difficulty percentages must sum to 100',
  });
export type DifficultyDistribution = z.infer<typeof DifficultyDistributionSchema>;

/** Input contract for worksheet generation (POST /api/worksheets). */
export const WorksheetSpecificationSchema = z.object({
  curriculum: z.enum(SUPPORTED_CURRICULA),
  grade: z.enum(SUPPORTED_GRADES),
  subject: z.enum(SUPPORTED_SUBJECTS),
  chapter: z.string().trim().max(200).optional(),
  topic: z.string().trim().min(2, 'Topic is too short').max(200),
  totalMarks: z.number().int().min(1).max(100),
  difficulty: DifficultyDistributionSchema.default({
    easyPercent: 40,
    mediumPercent: 40,
    hardPercent: 20,
  }),
});
export type WorksheetSpecification = z.infer<typeof WorksheetSpecificationSchema>;

// --- AI output schemas (validate model responses before persisting) ---

export const BlueprintSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  count: z.number().int().positive(),
  marks_each: z.number(),
  total_marks: z.number(),
  difficulty: z.string(),
});
export type BlueprintSection = z.infer<typeof BlueprintSectionSchema>;

export const BlueprintSchema = z.object({
  sections: z.array(BlueprintSectionSchema).min(1),
  total_marks: z.number(),
  questions_count: z.number().int(),
  bloom_levels: z.record(z.string(), z.number()).optional(),
});
export type Blueprint = z.infer<typeof BlueprintSchema>;

export const GeneratedQuestionSchema = z.object({
  id: z.string(),
  type: z.string(),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correct_answer: z.string(),
  explanation: z.string(),
  marks: z.number(),
  difficulty: z.string(),
  bloom: z.string(),
});
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

export const GeneratedQuestionsSchema = z.array(GeneratedQuestionSchema);

// --- Editor: save edited questions (PUT /api/worksheets/[id]) ---

export const WorksheetQuestionUpdateSchema = z.object({
  id: z.string().min(1),
  question: z.string().trim().min(1, 'Question cannot be empty'),
  correctAnswer: z.string(),
  marks: z.number().int().min(0).max(100).optional(),
  explanation: z.string().optional(),
});
export type WorksheetQuestionUpdate = z.infer<typeof WorksheetQuestionUpdateSchema>;

export const WorksheetUpdateSchema = z.object({
  questions: z.array(WorksheetQuestionUpdateSchema).min(1),
});
export type WorksheetUpdateInput = z.infer<typeof WorksheetUpdateSchema>;
