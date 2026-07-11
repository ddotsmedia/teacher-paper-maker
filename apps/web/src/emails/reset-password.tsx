import { button, emailLayout } from './layout';
import type { EmailContent } from './welcome';

export function resetPasswordEmail(params: { resetUrl: string }): EmailContent {
  const subject = 'Reset your Teacher Paper Maker password';
  const html = emailLayout(
    subject,
    `<p>We received a request to reset your password.</p>
     <p style="margin:24px 0;">${button(params.resetUrl, 'Reset password')}</p>
     <p style="color:#64748b;font-size:13px;">This link expires in 1 hour. If you did not request a reset, you can ignore this email and your password will stay the same.</p>`,
  );
  const text = `We received a request to reset your password.\n\nReset it here (expires in 1 hour): ${params.resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  return { subject, html, text };
}
