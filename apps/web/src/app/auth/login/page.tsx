'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { LoginSchema } from '@tpm/schemas';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  FormField,
  Input,
  Separator,
} from '@tpm/ui';
import { flattenIssues } from '@/lib/form';
import { GoogleButton } from '@/components/GoogleButton';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard';

  const [values, setValues] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed = LoginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(flattenIssues(parsed.error));
      return;
    }

    setSubmitting(true);
    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setSubmitting(false);

    if (!result || result.error) {
      setFormError('Invalid credentials');
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Log in to your Teacher Paper Maker account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField id="email" label="Email" error={errors.email}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={values.email}
              aria-invalid={Boolean(errors.email)}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            />
          </FormField>

          <FormField id="password" label="Password" error={errors.password}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              aria-invalid={Boolean(errors.password)}
              onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            />
          </FormField>

          <div className="flex items-center justify-between">
            <label className="text-muted-foreground flex items-center gap-2 text-sm">
              <Checkbox
                checked={values.rememberMe}
                onCheckedChange={(checked) =>
                  setValues((v) => ({ ...v, rememberMe: checked === true }))
                }
              />
              Remember me
            </label>
            <Link href="/auth/reset-password" className="text-primary text-sm hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" loading={submitting}>
            Log in
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-xs">OR</span>
          <Separator className="flex-1" />
        </div>

        <GoogleButton label="Log in with Google" />

        <p className="text-muted-foreground text-center text-sm">
          No account?{' '}
          <Link href="/auth/register" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
