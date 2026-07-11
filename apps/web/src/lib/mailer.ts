import nodemailer, { type Transporter } from 'nodemailer';
import { getEnv } from '@tpm/config';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const env = getEnv();
  if (env.NODE_ENV === 'test') {
    // Capture messages in-process; never open a socket during tests.
    transporter = nodemailer.createTransport({ jsonTransport: true });
  } else {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
    });
  }
  return transporter;
}

/**
 * Send an email. Failures are logged and swallowed so that transactional flows
 * (registration, password reset) never fail because SMTP is unreachable.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  const env = getEnv();
  try {
    await getTransporter().sendMail({
      from: env.SMTP_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  } catch (error) {
    console.error(`Failed to send "${message.subject}" email:`, error);
  }
}
