import { ResetPasswordRequestSchema } from '@tpm/schemas';
import { jsonOk, parseJson, route } from '@/lib/http';
import { requestPasswordReset } from '@/server/auth-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = route(async (request: Request) => {
  const { email } = await parseJson(request, ResetPasswordRequestSchema);
  await requestPasswordReset(email);
  // Always succeed so we never reveal whether the email is registered.
  return jsonOk({ success: true });
});
