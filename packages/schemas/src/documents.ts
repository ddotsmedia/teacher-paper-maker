import { z } from 'zod';

export const DocumentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['recent', 'oldest', 'starred']).default('recent'),
});
export type DocumentsQuery = z.infer<typeof DocumentsQuerySchema>;
