import { prisma } from '@tpm/database';
import { auth } from '@/auth';
import { HttpError, jsonOk, route } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Poll a generation job's status. Scoped to the authenticated owner. */
export const GET = route(
  async (_request: Request, context: { params: Promise<{ jobId: string }> }) => {
    const session = await auth();
    if (!session?.user?.id) throw new HttpError('Unauthorized', 401);

    const { jobId } = await context.params;
    const job = await prisma.generationJob.findFirst({
      where: { id: jobId, userId: session.user.id },
    });
    if (!job) throw new HttpError('Not found', 404);

    return jsonOk(job);
  },
);
