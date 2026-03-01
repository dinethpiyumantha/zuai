import type { ZodType } from "zod";

import type { AIProvider } from "../types/provider.js";
import { AIValidationError } from "../errors/ai-validation-error.js";
import { safeJsonParse } from "../utils/json-parser.js";
import {
  buildInitialPrompt,
  buildRepairPrompt,
} from "../utils/prompt-builder.js";
import { describeSchema } from "../utils/schema-description.js";

/** Options accepted by the retry loop. */
export interface ValidateAndRetryOptions<TOutput> {
  provider: AIProvider;
  prompt: string;
  schema: ZodType<TOutput>;
  maxRetries: number;
}

/**
 * Core retry loop — completely independent of any concrete provider.
 *
 * 1. Calls the provider with the initial prompt.
 * 2. Parses + validates the response.
 * 3. On failure, builds a repair prompt and retries up to `maxRetries` times.
 * 4. Throws `AIValidationError` if all attempts fail.
 */
export async function validateAndRetry<TOutput>(
  opts: ValidateAndRetryOptions<TOutput>,
): Promise<TOutput> {
  const { provider, prompt, schema, maxRetries } = opts;

  const schemaDescription = describeSchema(schema);
  const totalAttempts = 1 + maxRetries;

  let lastRawOutput = "";
  let lastErrors: string[] = [];

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    // ── Build prompt ────────────────────────────────────────────────────
    const currentPrompt =
      attempt === 1
        ? buildInitialPrompt(prompt, schemaDescription)
        : buildRepairPrompt(
            prompt,
            lastRawOutput,
            lastErrors.join("\n"),
            schemaDescription,
          );

    // ── Call provider ───────────────────────────────────────────────────
    lastRawOutput = await provider.complete(currentPrompt);

    // ── Parse JSON ──────────────────────────────────────────────────────
    const parseResult = safeJsonParse(lastRawOutput);

    if (!parseResult.ok) {
      lastErrors = [parseResult.error];
      continue; // move to next attempt
    }

    // ── Validate with Zod ───────────────────────────────────────────────
    const zodResult = schema.safeParse(parseResult.data);

    if (zodResult.success) {
      return zodResult.data;
    }

    // Collect human‑readable error messages
    lastErrors = zodResult.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
  }

  // All attempts exhausted
  throw new AIValidationError({
    lastRawOutput,
    validationIssues: lastErrors,
    attempts: totalAttempts,
  });
}
