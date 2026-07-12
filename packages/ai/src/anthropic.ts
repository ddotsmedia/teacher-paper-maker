import Anthropic from '@anthropic-ai/sdk';
import { loadPrompt, interpolatePrompt } from './prompt-loader';
import { GenerationError } from './errors';
import type {
  AiProvider,
  StructuredGenerationRequest,
  StructuredGenerationResult,
} from './provider';

/**
 * Default model. Per Anthropic guidance we do NOT silently downgrade for cost —
 * callers wanting cheap, high-volume generation pass `modelConfig.model:
 * 'claude-haiku-4-5'`.
 */
const DEFAULT_MODEL = 'claude-opus-4-8';
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;

/** USD per million tokens, by model. Used for cost logging; unknown models fall back to the default. */
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-8': { input: 5, output: 25 },
  'claude-opus-4-7': { input: 5, output: 25 },
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-haiku-4-5': { input: 1, output: 5 },
  'claude-fable-5': { input: 10, output: 50 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rate = PRICING[model] ?? PRICING[DEFAULT_MODEL]!;
  return (inputTokens * rate.input + outputTokens * rate.output) / 1_000_000;
}

/** HTTP statuses that will never succeed on retry (bad request, auth, permission, not found). */
const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404]);

export class AnthropicProvider implements AiProvider {
  private client: Anthropic;

  constructor(apiKey?: string) {
    // Fall back to the SDK's env-based credential resolution when no key is passed.
    this.client = new Anthropic(apiKey ? { apiKey } : {});
  }

  async generateStructured<TInput, TOutput>(
    request: StructuredGenerationRequest<TInput, TOutput>,
  ): Promise<StructuredGenerationResult<TOutput>> {
    const startTime = Date.now();
    const model = request.modelConfig?.model ?? DEFAULT_MODEL;
    const maxTokens = request.modelConfig?.maxTokens ?? DEFAULT_MAX_TOKENS;
    const timeout = Math.min(request.timeout ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const template = await loadPrompt(request.promptVersion);
        const prompt = interpolatePrompt(template, request.input as Record<string, unknown>);

        const response = await this.client.messages.create(
          {
            model,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }],
          },
          { timeout },
        );

        const textBlock = response.content.find(
          (block): block is Anthropic.TextBlock => block.type === 'text',
        );
        const jsonMatch = textBlock?.text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (!jsonMatch?.[0]) {
          throw new GenerationError('Model response contained no JSON', { retryable: true });
        }

        const parsed: unknown = JSON.parse(jsonMatch[0]);
        const output = request.schema.parse(parsed);

        return {
          output,
          provider: 'anthropic',
          model: response.model,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          latencyMs: Date.now() - startTime,
          estimatedCost: estimateCost(
            response.model,
            response.usage.input_tokens,
            response.usage.output_tokens,
          ),
          retryCount: attempt,
          validationStatus: 'success',
        };
      } catch (error) {
        lastError = error as Error;

        // Don't waste retries on errors that can't succeed on a re-attempt.
        if (error instanceof GenerationError && !error.options.retryable) throw error;
        if (error instanceof Anthropic.APIError && NON_RETRYABLE_STATUSES.has(error.status ?? 0)) {
          throw new GenerationError(`Anthropic request failed: ${error.message}`, {
            retryable: false,
            code: String(error.status),
          });
        }

        if (attempt < MAX_RETRIES - 1) {
          const delayMs = 2 ** (attempt + 1) * 1000; // 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw new GenerationError(`Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`, {
      retryable: false,
      code: 'MAX_RETRIES_EXCEEDED',
    });
  }
}
