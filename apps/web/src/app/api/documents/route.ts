import { DocumentsQuerySchema } from '@tpm/schemas';
import { HttpError, jsonError, jsonOk, route } from '@/lib/http';
import { auth } from '@/auth';
import { listDocuments } from '@/server/documents-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const parsed = DocumentsQuerySchema.safeParse({
    limit: searchParams.get('limit') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
  });
  if (!parsed.success) {
    return jsonError('Invalid query parameters', 400);
  }

  const result = await listDocuments(session.user.id, parsed.data);
  return jsonOk(result);
});
