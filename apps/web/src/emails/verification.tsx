import { button, emailLayout } from './layout';
import type { EmailContent } from './welcome';

export function verificationEmail(params: { verifyUrl: string }): EmailContent {
  const subject = 'Verify your email address';
  const html = emailLayout(
    subject,
    `<p>Please confirm your email address to finish setting up your account.</p>
     <p style="margin:24px 0;">${button(params.verifyUrl, 'Verify email')}</p>
     <p style="color:#64748b;font-size:13px;">If you did not create an account, you can ignore this email.</p>`,
  );
  const text = `Please confirm your email address: ${params.verifyUrl}\n\nIf you did not create an account, ignore this email.`;
  return { subject, html, text };
}
