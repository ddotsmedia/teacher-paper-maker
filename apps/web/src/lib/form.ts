import type { ZodError } from 'zod';

/** Convert a ZodError into a flat { field: firstMessage } map for inline errors. */
export function flattenIssues(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
