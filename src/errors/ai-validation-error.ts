/**
 * Thrown when the AI output cannot be coerced into the expected Zod schema
 * even after all retry attempts have been exhausted.
 */
export class AIValidationError extends Error {
  /** The raw string the AI returned on its last attempt. */
  public readonly lastRawOutput: string;

  /** Zod (or JSON‑parse) issues collected on the final attempt. */
  public readonly validationIssues: ReadonlyArray<string>;

  /** How many attempts were made in total (initial + retries). */
  public readonly attempts: number;

  constructor(opts: {
    lastRawOutput: string;
    validationIssues: ReadonlyArray<string>;
    attempts: number;
    message?: string;
  }) {
    super(
      opts.message ??
        `AI output failed schema validation after ${opts.attempts} attempt(s).`,
    );
    this.name = "AIValidationError";
    this.lastRawOutput = opts.lastRawOutput;
    this.validationIssues = opts.validationIssues;
    this.attempts = opts.attempts;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
