'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ResetPasswordFormSchema } from '@tpm/schemas';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  toast,
} from '@tpm/ui';
import { apiRequest } from '@/lib/api-client';
import { flattenIssues } from '@/lib/form';

export default function ResetPasswordConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [values, setValues] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed = ResetPasswordFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(flattenIssues(parsed.error));
      return;
    }

    setSubmitting(true);
    const result = await apiRequest('/api/auth/reset-password-confirm', {
      method: 'POST',
      body: { token, password: values.password },
    });
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error?.error ?? 'Token invalid or expired');
      return;
    }

    toast.success('Password updated');
    router.push('/auth/login');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a strong password for your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            id="password"
            label="New password"
            error={errors.password}
            hint="At least 8 characters, one uppercase letter and one number."
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              aria-invalid={Boolean(errors.password)}
              onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            />
          </FormField>

          <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              aria-invalid={Boolean(errors.confirmPassword)}
              onChange={(e) => setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
            />
          </FormField>

          <Button type="submit" className="w-full" loading={submitting}>
            Update password
          </Button>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          <Link href="/auth/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
