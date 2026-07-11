import { RegisterSchema } from '@tpm/schemas';
import { jsonOk, parseJson, route } from '@/lib/http';
import { registerUser } from '@/server/auth-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = route(async (request: Request) => {
  const input = await parseJson(request, RegisterSchema);
  await registerUser(input);
  return jsonOk({ success: true, message: 'Check email to verify' }, 201);
});
