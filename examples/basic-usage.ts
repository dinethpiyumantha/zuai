/**
 * Usage example — demonstrates how to use runStructuredPrompt
 * with a Zod schema to get type‑safe, validated AI output.
 *
 * Run: npx tsx examples/basic-usage.ts
 *
 * Make sure OPENAI_API_KEY is set in your environment.
 */
import { z } from "zod";
import {
  runStructuredPrompt,
  AIValidationError,
  OpenAIProvider,
} from "../src/index.js";

// ── Define the expected response shape ──────────────────────────────────────
const ColourListSchema = z.object({
  colours: z.array(
    z.object({
      name: z.string(),
      hex: z.string(),
    }),
  ),
});

// TypeScript infers: { colours: { name: string; hex: string }[] }
type ColourList = z.infer<typeof ColourListSchema>;

async function main(): Promise<void> {
  try {
    // Option A — use the default provider (OpenAI, reads OPENAI_API_KEY)
    const result: ColourList = await runStructuredPrompt({
      prompt: "List 5 popular web‑safe colours with their hex codes.",
      schema: ColourListSchema,
      maxRetries: 2,
    });

    console.log("Validated result:", JSON.stringify(result, null, 2));

    // Option B — supply your own provider instance
    const customProvider = new OpenAIProvider({
      model: "gpt-4o-mini",
      temperature: 0.2,
    });

    const result2 = await runStructuredPrompt({
      prompt: "Give me 3 warm colours and their hex codes.",
      schema: ColourListSchema,
      provider: customProvider,
    });

    console.log("Custom provider result:", JSON.stringify(result2, null, 2));
  } catch (error) {
    if (error instanceof AIValidationError) {
      console.error("AI validation failed after", error.attempts, "attempts.");
      console.error("Last raw output:", error.lastRawOutput);
      console.error("Issues:", error.validationIssues);
    } else {
      throw error;
    }
  }
}

main();
