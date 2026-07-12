import { prisma } from '@tpm/database';
import { WorksheetUpdateSchema } from '@tpm/schemas';
import { auth } from '@/auth';
import { HttpError, jsonOk, parseJson, route } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StoredAnswer {
  correctAnswer?: string;
  options?: string[];
  explanation?: string;
}

/** Fetch a worksheet and its questions, scoped to the authenticated owner. */
export const GET = route(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const session = await auth();
    if (!session?.user?.id) throw new HttpError('Unauthorized', 401);

    const { id } = await context.params;
    const doc = await prisma.document.findFirst({
      where: { id, userId: session.user.id, deletedAt: null },
      include: {
        questions: { where: { deletedAt: null }, orderBy: { displayOrder: 'asc' } },
      },
    });
    if (!doc) throw new HttpError('Not found', 404);

    return jsonOk({
      id: doc.id,
      title: doc.title,
      status: doc.status,
      curriculum: doc.curriculum,
      grade: doc.grade,
      subject: doc.subject,
      topic: doc.topic,
      questions: doc.questions.map((q) => {
        const answer = (q.answerJson ?? {}) as StoredAnswer;
        return {
          id: q.id,
          type: q.type,
          question: q.question,
          correctAnswer: answer.correctAnswer ?? '',
          options: answer.options ?? [],
          explanation: answer.explanation ?? '',
          marks: q.marks,
          difficulty: q.difficulty,
          bloomLevel: q.bloomLevel,
          displayOrder: q.displayOrder,
        };
      }),
    });
  },
);

/** Save edited questions. Only questions belonging to the owned document are updated. */
export const PUT = route(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError('Unauthorized', 401);

  const { id } = await context.params;
  const { questions } = await parseJson(request, WorksheetUpdateSchema);

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!doc) throw new HttpError('Not found', 404);

  const existing = await prisma.question.findMany({
    where: { documentId: id, deletedAt: null },
    select: { id: true, answerJson: true },
  });
  const previous = new Map(existing.map((q) => [q.id, (q.answerJson ?? {}) as StoredAnswer]));

  const updates = questions
    .filter((q) => previous.has(q.id))
    .map((q) =>
      prisma.question.update({
        where: { id: q.id },
        data: {
          question: q.question,
          ...(q.marks !== undefined ? { marks: q.marks } : {}),
          answerJson: {
            ...previous.get(q.id),
            correctAnswer: q.correctAnswer,
            ...(q.explanation !== undefined ? { explanation: q.explanation } : {}),
          },
        },
      }),
    );

  await prisma.$transaction(updates);
  return jsonOk({ success: true, updated: updates.length });
});
