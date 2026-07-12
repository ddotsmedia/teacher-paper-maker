/** Error thrown by AI generation steps; `retryable` drives the retry/backoff loop. */
export class GenerationError extends Error {
  constructor(
    message: string,
    public options: { retryable: boolean; code?: string } = { retryable: false },
  ) {
    super(message);
    this.name = 'GenerationError';
  }
}
