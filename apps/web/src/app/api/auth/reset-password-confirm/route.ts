import { ResetPasswordConfirmSchema } from '@tpm/schemas';
import { jsonOk, parseJson, route } from '@/lib/http';
import { confirmPasswordReset } from '@/server/auth-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = route(async (request: Request) => {
  const { token, password } = await parseJson(request, ResetPasswordConfirmSchema);
  await confirmPasswordReset(token, password);
  return jsonOk({ success: true });
});
