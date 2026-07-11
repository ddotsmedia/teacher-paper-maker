import { button, emailLayout } from './layout';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function welcomeEmail(params: { name: string; loginUrl: string }): EmailContent {
  const subject = 'Welcome to Teacher Paper Maker';
  const html = emailLayout(
    subject,
    `<p>Hi ${params.name},</p>
     <p>Your Teacher Paper Maker account is ready. You can now sign in and set up your teaching profile to start creating worksheets.</p>
     <p style="margin:24px 0;">${button(params.loginUrl, 'Sign in')}</p>
     <p style="color:#64748b;font-size:13px;">If you did not create this account, you can safely ignore this email.</p>`,
  );
  const text = `Hi ${params.name},\n\nYour Teacher Paper Maker account is ready. Sign in at ${params.loginUrl} to get started.\n\nIf you did not create this account, you can ignore this email.`;
  return { subject, html, text };
}
