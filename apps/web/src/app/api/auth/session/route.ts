import { auth } from '@/auth';
import { jsonOk } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public: returns the current session user (or null). */
export async function GET() {
  const session = await auth();
  const user = session?.user
    ? { id: session.user.id, email: session.user.email ?? null, name: session.user.name ?? null }
    : null;
  return jsonOk({ user });
}
