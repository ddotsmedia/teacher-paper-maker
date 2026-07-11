'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegisterFormSchema } from '@tpm/schemas';
import {
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
  toast,
} from '@tpm/ui';
import { apiRequest } from '@/lib/api-client';
import { flattenIssues } from '@/lib/form';
import { GoogleButton } from '@/components/GoogleButton';

type Errors = Partial<Record<string, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const parsed = RegisterFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(flattenIssues(parsed.error));
      return;
    }

    setSubmitting(true);
    const result = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: { name: values.name, email: values.email, password: values.password },
    });
    setSubmitting(false);

    if (!result.ok) {
      if (result.error?.issues) setErrors(result.error.issues);
      else setErrors({ email: result.error?.error ?? 'Registration failed' });
      return;
    }

    toast.success('Account created. Check your email to verify.');
    router.push('/auth/login');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start building worksheets for your class.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField id="name" label="Full name" error={errors.name}>
            <Input
              id="name"
              autoComplete="name"
              value={values.name}
              aria-invalid={Boolean(errors.name)}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
          </FormField>

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

          <FormField
            id="password"
            label="Password"
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

          <div className="flex items-start gap-2">
            <Checkbox
              id="agreeToTerms"
              checked={values.agreeToTerms}
              onCheckedChange={(checked) =>
                setValues((v) => ({ ...v, agreeToTerms: checked === true }))
              }
            />
            <label htmlFor="agreeToTerms" className="text-muted-foreground text-sm leading-tight">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </label>
          </div>
          {errors.agreeToTerms ? (
            <p className="text-destructive text-sm font-medium">{errors.agreeToTerms}</p>
          ) : null}

          <Button type="submit" className="w-full" loading={submitting}>
            Create account
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-xs">OR</span>
          <Separator className="flex-1" />
        </div>

        <GoogleButton label="Sign up with Google" />

        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
