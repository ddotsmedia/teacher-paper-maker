import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Parse a request JSON body against a Zod schema. Throws {@link HttpError} (400) on failure. */
export async function parseJson<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError('Invalid JSON body', 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError('Validation failed', 400, { issues: flattenZodError(parsed.error) });
  }
  return parsed.data;
}

export function flattenZodError(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export class HttpError extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(message: string, status = 400, extra?: Record<string, unknown>) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.extra = extra;
  }
}

/**
 * Wrap a route handler so thrown {@link HttpError} becomes a clean JSON response
 * and unexpected errors become a 500 without leaking internals.
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof HttpError) {
        return jsonError(error.message, error.status, error.extra);
      }
      console.error('Unhandled route error:', error);
      return jsonError('Internal server error', 500);
    }
  };
}
