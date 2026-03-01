import type { ZodType } from "zod";

import type { AIProvider } from "../types/provider.js";
import { OpenAIProvider } from "../providers/openai-provider.js";
import { validateAndRetry } from "./validate-and-retry.js";

/** Options for `runStructuredPrompt`. */
export interface RunStructuredPromptOptions<TOutput> {
  /** The natural‑language prompt to send to the AI. */
  prompt: string;

  /** A Zod schema describing the expected JSON structure. */
  schema: ZodType<TOutput>;

  /**
   * Maximum number of repair retries if validation fails.
   * @default 3
   */
  maxRetries?: number;

  /**
   * An `AIProvider` instance to use.
   * Falls back to a default `OpenAIProvider` when omitted.
   */
  provider?: AIProvider;
}

/**
 * Send a prompt to an AI model and receive back a **strongly typed**,
 * **Zod‑validated** result.
 *
 * @example
 * ```ts
 * import { z } from "zod";
 * import { runStructuredPrompt } from "ai-orchestrator";
 *
 * const result = await runStructuredPrompt({
 *   prompt: "List three colours and their hex codes",
 *   schema: z.object({
 *     colours: z.array(z.object({
 *       name: z.string(),
 *       hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
 *     })),
 *   }),
 * });
 *
 * // result is fully typed:
 * // { colours: { name: string; hex: string }[] }
 * ```
 */
export async function runStructuredPrompt<TOutput>(
  options: RunStructuredPromptOptions<TOutput>,
): Promise<TOutput> {
  const {
    prompt,
    schema,
    maxRetries = 3,
    provider = new OpenAIProvider(),
  } = options;

  return validateAndRetry({ provider, prompt, schema, maxRetries });
}
