import type { ZodType } from 'zod';

export interface ModelConfig {
  /** Model id. Defaults to claude-opus-4-8; pass claude-haiku-4-5 for cheap, high-volume generation. */
  model?: string;
  maxTokens?: number;
}

export interface StructuredGenerationRequest<TInput, TOutput> {
  /** Versioned prompt id, e.g. `worksheet/blueprint.v1`, resolved by the prompt loader. */
  promptVersion: string;
  /** Values interpolated into the prompt template. */
  input: TInput;
  /** Zod schema the model output is validated against before returning. */
  schema: ZodType<TOutput>;
  /** Per-request timeout in ms (clamped to 60s). */
  timeout?: number;
  modelConfig?: ModelConfig;
}

export type ValidationStatus = 'success' | 'failed';

export interface StructuredGenerationResult<TOutput> {
  output: TOutput;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  estimatedCost: number;
  retryCount: number;
  validationStatus: ValidationStatus;
}

/** Provider-agnostic interface: swap Claude for another provider without touching callers. */
export interface AiProvider {
  generateStructured<TInput, TOutput>(
    request: StructuredGenerationRequest<TInput, TOutput>,
  ): Promise<StructuredGenerationResult<TOutput>>;
}
