import { prisma, type Prisma } from '@tpm/database';
import { WorksheetSpecificationSchema } from '@tpm/schemas';
import { worksheetQueue } from '@tpm/queue';
import { auth } from '@/auth';
import { HttpError, jsonOk, parseJson, route } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Create a worksheet document + generation job, then enqueue the generation. */
export const POST = route(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError('Unauthorized', 401);
  const userId = session.user.id;

  const spec = await parseJson(request, WorksheetSpecificationSchema);
  const specJson = { spec: { ...spec, chapter: spec.chapter ?? null } } as Prisma.InputJsonObject;

  const { document, job } = await prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        userId,
        type: 'WORKSHEET',
        title: `${spec.subject} - ${spec.topic}`,
        curriculum: spec.curriculum,
        grade: spec.grade,
        subject: spec.subject,
        chapter: spec.chapter ?? null,
        topic: spec.topic,
        status: 'DRAFT',
        contentJson: specJson,
      },
    });

    const job = await tx.generationJob.create({
      data: {
        userId,
        documentId: document.id,
        provider: 'anthropic',
        model: 'claude-opus-4-8',
        requestType: 'worksheet_generation',
        status: 'PENDING',
      },
    });

    return { document, job };
  });

  await worksheetQueue.add('generate', { userId, documentId: document.id, jobId: job.id, spec });

  return jsonOk({ jobId: job.id, documentId: document.id }, 201);
});
