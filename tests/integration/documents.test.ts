import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@tpm/database';
import { registerUser } from '../../apps/web/src/server/auth-service';
import { getDocumentStats, listDocuments } from '../../apps/web/src/server/documents-service';
import { resetDatabase } from '../helpers/db';

async function seedUsers() {
  await registerUser({ email: 'owner@example.com', name: 'Owner', password: 'Password1' });
  await registerUser({ email: 'other@example.com', name: 'Other', password: 'Password1' });
  const owner = await prisma.user.findUniqueOrThrow({ where: { email: 'owner@example.com' } });
  const other = await prisma.user.findUniqueOrThrow({ where: { email: 'other@example.com' } });
  return { owner, other };
}

describe('documents service', () => {
  beforeEach(resetDatabase);

  it('scopes listing to the owner and excludes soft-deleted rows', async () => {
    const { owner, other } = await seedUsers();
    await prisma.document.createMany({
      data: [
        { userId: owner.id, title: 'Owner A' },
        { userId: owner.id, title: 'Owner B', deletedAt: new Date() },
        { userId: other.id, title: 'Other A' },
      ],
    });

    const result = await listDocuments(owner.id, { limit: 10, sort: 'recent' });
    expect(result.documents.map((d) => d.title)).toEqual(['Owner A']);
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('honors the limit and reports hasMore', async () => {
    const { owner } = await seedUsers();
    await prisma.document.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({ userId: owner.id, title: `Doc ${i}` })),
    });

    const result = await listDocuments(owner.id, { limit: 2, sort: 'recent' });
    expect(result.documents).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.hasMore).toBe(true);
  });

  it('computes dashboard stats', async () => {
    const { owner } = await seedUsers();
    await prisma.document.createMany({
      data: [
        { userId: owner.id, title: 'Today 1' },
        { userId: owner.id, title: 'Today 2' },
      ],
    });

    const stats = await getDocumentStats(owner.id);
    expect(stats.total).toBe(2);
    expect(stats.createdToday).toBe(2);
  });
});
