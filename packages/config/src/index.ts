import { z } from 'zod';

/**
 * Server-side environment validation. Import only from server code (route
 * handlers, server components, scripts) — never from client components.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().url(),

  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 characters'),
  AUTH_URL: z.string().url().default('http://localhost:3000'),

  AUTH_GOOGLE_ID: z.string().min(1).default('google-oauth-client-id'),
  AUTH_GOOGLE_SECRET: z.string().min(1).default('google-oauth-secret'),

  SMTP_HOST: z.string().min(1).default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_FROM: z.string().min(1).default('noreply@teacherpaper.local'),

  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  ANTHROPIC_API_KEY: z.string().optional(),

  APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

/** Parse and cache environment. Throws a readable error if config is invalid. */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** True when Google OAuth is configured with real (non-placeholder) credentials. */
export function isGoogleAuthConfigured(env: Env = getEnv()): boolean {
  return (
    env.AUTH_GOOGLE_ID !== 'google-oauth-client-id' &&
    env.AUTH_GOOGLE_SECRET !== 'google-oauth-secret' &&
    env.AUTH_GOOGLE_ID.length > 0 &&
    env.AUTH_GOOGLE_SECRET.length > 0
  );
}
