import fs from 'node:fs/promises';
import path from 'node:path';

const prompts = new Map<string, string>();

/**
 * Directory that holds versioned prompt files. Resolved from PROMPTS_DIR when
 * set, otherwise `<cwd>/prompts` (the repo root when run via workspace scripts).
 */
function promptsRoot(): string {
  return process.env.PROMPTS_DIR ?? path.join(process.cwd(), 'prompts');
}

/**
 * Load a versioned prompt by its id, e.g. `worksheet/blueprint.v1`, which maps
 * to `<promptsRoot>/worksheet/blueprint.v1.md`. Results are cached by version.
 */
export async function loadPrompt(version: string): Promise<string> {
  const cached = prompts.get(version);
  if (cached !== undefined) return cached;

  const filePath = path.join(promptsRoot(), `${version}.md`);
  const content = await fs.readFile(filePath, 'utf-8');
  prompts.set(version, content);
  return content;
}

/**
 * Replace every `{key}` placeholder in the template. Non-string values are
 * JSON-encoded. Uses replaceAll so repeated placeholders are all substituted.
 */
export function interpolatePrompt(template: string, vars: Record<string, unknown>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const replacement = typeof value === 'string' ? value : JSON.stringify(value);
    result = result.replaceAll(`{${key}}`, replacement);
  }
  return result;
}

/** Clear the in-memory prompt cache (useful in tests). */
export function clearPromptCache(): void {
  prompts.clear();
}
