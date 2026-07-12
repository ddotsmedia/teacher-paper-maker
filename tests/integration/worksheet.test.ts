import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@tpm/database';
import { WorksheetSpecificationSchema } from '@tpm/schemas';
import { resetDatabase } from '../helpers/db';

describe('worksheet', () => {
  beforeEach(resetDatabase);

  it('accepts a valid worksheet specification', () => {
    const spec = {
      curriculum: 'CBSE',
      grade: '5',
      subject: 'Science',
      chapter: 'Life Processes',
      topic: 'Respiration',
      totalMarks: 20,
      difficulty: { easyPercent: 50, mediumPercent: 30, hardPercent: 20 },
    };
    expect(WorksheetSpecificationSchema.safeParse(spec).success).toBe(true);
  });

  it('rejects a difficulty distribution that does not sum to 100', () => {
    const result = WorksheetSpecificationSchema.safeParse({
      curriculum: 'CBSE',
      grade: '5',
      subject: 'Science',
      topic: 'Respiration',
      totalMarks: 20,
      difficulty: { easyPercent: 50, mediumPercent: 30, hardPercent: 30 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unsupported curriculum', () => {
    const result = WorksheetSpecificationSchema.safeParse({
      curriculum: 'State Board',
      grade: '5',
      subject: 'Science',
      topic: 'Respiration',
      totalMarks: 20,
    });
    expect(result.success).toBe(false);
  });

  it('creates a pending generation job for a document', async () => {
    const user = await prisma.user.create({ data: { email: 'ws@example.com', name: 'WS' } });
    const document = await prisma.document.create({
      data: { userId: user.id, title: 'Science - Respiration', status: 'DRAFT' },
    });

    const job = await prisma.generationJob.create({
      data: {
        userId: user.id,
        documentId: document.id,
        provider: 'anthropic',
        model: 'claude-opus-4-8',
        requestType: 'worksheet_generation',
        status: 'PENDING',
      },
    });

    expect(job.status).toBe('PENDING');
    expect(job.documentId).toBe(document.id);
  });
});
