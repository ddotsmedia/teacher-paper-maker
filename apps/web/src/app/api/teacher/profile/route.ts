import { TeacherProfileSchema } from '@tpm/schemas';
import { HttpError, jsonOk, parseJson, route } from '@/lib/http';
import { auth } from '@/auth';
import { getTeacherProfile, updateTeacherProfile } from '@/server/teacher-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError('Unauthorized', 401);
  const profile = await getTeacherProfile(session.user.id);
  return jsonOk({ profile });
});

export const PUT = route(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError('Unauthorized', 401);
  const input = await parseJson(request, TeacherProfileSchema);
  const profile = await updateTeacherProfile(session.user.id, input);
  return jsonOk({ success: true, profile });
});
