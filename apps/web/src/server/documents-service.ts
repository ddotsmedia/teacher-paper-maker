import { prisma, type Prisma } from '@tpm/database';
import type { DocumentsQuery } from '@tpm/schemas';

export interface DocumentDto {
  id: string;
  title: string;
  curriculum: string | null;
  grade: string | null;
  subject: string | null;
  status: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentsResult {
  documents: DocumentDto[];
  total: number;
  hasMore: boolean;
}

function orderBy(sort: DocumentsQuery['sort']): Prisma.DocumentOrderByWithRelationInput[] {
  switch (sort) {
    case 'oldest':
      return [{ createdAt: 'asc' }];
    case 'starred':
      return [{ starred: 'desc' }, { createdAt: 'desc' }];
    case 'recent':
    default:
      return [{ createdAt: 'desc' }];
  }
}

export interface DocumentStats {
  total: number;
  createdToday: number;
}

/** Aggregate counts for the dashboard header, scoped by userId. */
export async function getDocumentStats(userId: string): Promise<DocumentStats> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [total, createdToday] = await Promise.all([
    prisma.document.count({ where: { userId, deletedAt: null } }),
    prisma.document.count({
      where: { userId, deletedAt: null, createdAt: { gte: startOfToday } },
    }),
  ]);

  return { total, createdToday };
}

/** List a user's non-deleted documents, scoped strictly by userId. */
export async function listDocuments(
  userId: string,
  query: DocumentsQuery,
): Promise<DocumentsResult> {
  const where: Prisma.DocumentWhereInput = { userId, deletedAt: null };

  const [rows, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: orderBy(query.sort),
      take: query.limit,
    }),
    prisma.document.count({ where }),
  ]);

  const documents: DocumentDto[] = rows.map((doc) => ({
    id: doc.id,
    title: doc.title,
    curriculum: doc.curriculum,
    grade: doc.grade,
    subject: doc.subject,
    status: doc.status,
    starred: doc.starred,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }));

  return { documents, total, hasMore: total > rows.length };
}
