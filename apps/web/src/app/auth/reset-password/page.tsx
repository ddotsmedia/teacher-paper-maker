'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ResetPasswordRequestSchema } from '@tpm/schemas';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
} from '@tpm/ui';
import { apiRequest } from '@/lib/api-client';
import { flattenIssues } from '@/lib/form';

export default function ResetPasswordRequestPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const parsed = ResetPasswordRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors(flattenIssues(parsed.error));
      return;
    }

    setSubmitting(true);
    await apiRequest('/api/auth/reset-password-request', { method: 'POST', body: { email } });
    setSubmitting(false);
    setSent(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to reset it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sent ? (
          <Alert variant="success">
            <AlertTitle>Check your email</AlertTitle>
            <AlertDescription>
              If an account exists for {email}, a reset link is on its way. The link expires in 1
              hour.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField id="email" label="Email" error={errors.email}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                aria-invalid={Boolean(errors.email)}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
            <Button type="submit" className="w-full" loading={submitting}>
              Send reset link
            </Button>
          </form>
        )}

        <p className="text-muted-foreground text-center text-sm">
          <Link href="/auth/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
