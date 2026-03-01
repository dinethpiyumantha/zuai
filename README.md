# zuai

**TypeScript-first AI orchestration utility for Node.js — get structured, Zod-validated JSON from any LLM.**

Send a natural-language prompt, define the shape you expect with a Zod schema, and get back a **fully typed**, **validated** result. If the AI returns malformed or invalid JSON, `zuai` automatically retries with a repair prompt — no manual parsing, no `any` types, no guesswork.

---

## Features

- **Structured output** — define your expected response shape with Zod; get back `z.infer<typeof schema>` with full IntelliSense.
- **Auto-repair retries** — if the AI returns broken JSON or fails validation, the library sends the errors back to the model and asks it to fix its output.
- **Safe JSON parsing** — strips markdown fences, finds the outermost `{}`/`[]`, handles all common AI response quirks before `JSON.parse`.
- **Provider-agnostic** — ships with `OpenAIProvider` out of the box; swap in Anthropic, Gemini, Ollama, or any custom backend by implementing a single method.
- **Zero `any` types** — end-to-end type safety from schema definition to returned data.
- **Custom error class** — `AIValidationError` carries the raw output, validation issues, and attempt count for easy debugging.
- **Small & composable** — each concern (parsing, prompts, retry logic, provider) lives in its own module and can be used independently.

---

## Installation

```bash
npm install zuai
```

> **Peer dependency:** `zod` >= 4.x must be installed in your project.

---

## Quick Start

```typescript
import { z } from "zod";
import { runStructuredPrompt } from "zuai";

const result = await runStructuredPrompt({
  prompt: "List 3 popular programming languages with their creators.",
  schema: z.object({
    languages: z.array(
      z.object({
        name: z.string(),
        creator: z.string(),
        year: z.number(),
      }),
    ),
  }),
});

// result is fully typed:
// { languages: { name: string; creator: string; year: number }[] }
console.log(result.languages);
```

Set your API key before running:

```bash
export OPENAI_API_KEY="sk-..."
```

---

## API Reference

### `runStructuredPrompt(options)`

The main entry point. Sends a prompt to an AI model and returns a validated, strongly-typed result.

```typescript
function runStructuredPrompt<TOutput>(
  options: RunStructuredPromptOptions<TOutput>,
): Promise<TOutput>;
```

#### Options

| Property | Type | Default | Description |
|---|---|---|---|
| `prompt` | `string` | *required* | Natural-language prompt to send to the AI |
| `schema` | `ZodType<TOutput>` | *required* | Zod schema describing the expected JSON shape |
| `maxRetries` | `number` | `3` | Number of repair retries if validation fails |
| `provider` | `AIProvider` | `new OpenAIProvider()` | Any object implementing the `AIProvider` interface |

#### Return value

`Promise<TOutput>` — the parsed and validated result, typed as `z.infer<typeof schema>`.

#### Throws

- `AIValidationError` — when all attempts (initial + retries) are exhausted.
- Standard errors from the underlying provider (network failures, auth errors, etc.).

---

### `AIProvider` Interface

```typescript
interface AIProvider {
  complete(prompt: string): Promise<string>;
}
```

Implement this single method to plug in **any** LLM backend. The library never touches provider SDKs directly — only this interface.

---

### `OpenAIProvider`

Built-in provider for the OpenAI Chat Completions API.

```typescript
import { OpenAIProvider } from "zuai";

const provider = new OpenAIProvider({
  apiKey: "sk-...",       // default: process.env.OPENAI_API_KEY
  model: "gpt-4o",       // default: "gpt-4o"
  temperature: 0,         // default: 0
  maxTokens: 4096,        // default: 4096
});
```

| Config Property | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | `OPENAI_API_KEY` env var | OpenAI API key |
| `model` | `string` | `"gpt-4o"` | Model identifier |
| `temperature` | `number` | `0` | Sampling temperature (0 = deterministic) |
| `maxTokens` | `number` | `4096` | Maximum tokens to generate |

---

### `AIValidationError`

Custom error thrown when validation fails after all retry attempts.

```typescript
import { AIValidationError } from "zuai";

try {
  const result = await runStructuredPrompt({ ... });
} catch (error) {
  if (error instanceof AIValidationError) {
    console.error(error.message);           // Human-readable summary
    console.error(error.attempts);          // Total attempts made (e.g. 4)
    console.error(error.lastRawOutput);     // The AI's last raw response
    console.error(error.validationIssues);  // Array of Zod error strings
  }
}
```

| Property | Type | Description |
|---|---|---|
| `lastRawOutput` | `string` | Raw text from the AI's final attempt |
| `validationIssues` | `ReadonlyArray<string>` | Zod error messages from the last attempt |
| `attempts` | `number` | Total number of attempts (1 initial + retries) |

---

### Utility Exports

These are exported for advanced usage, testing, or custom orchestration:

| Export | Description |
|---|---|
| `safeJsonParse(raw: string)` | Extracts and parses JSON from raw AI text. Returns `{ ok: true, data }` or `{ ok: false, error }`. |
| `buildInitialPrompt(userPrompt, schemaDescription)` | Builds the first prompt sent to the model. |
| `buildRepairPrompt(originalPrompt, previousOutput, validationError, schemaDescription)` | Builds the retry/repair prompt with error context. |
| `describeSchema(schema: ZodType)` | Converts a Zod schema into a human-readable description for prompt injection. |

---

## How It Works

```
┌─────────────┐
│  Your Code   │
│              │
│  prompt +    │
│  Zod schema  │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ runStructuredPrompt │
│                    │
│  1. Build prompt   │
│  2. Call provider  │──────▶  AIProvider.complete()
│  3. Parse JSON     │              │
│  4. Validate (Zod) │◀─────────────┘
│                    │
│  ✓ Valid? Return   │──────▶  Typed result ✨
│                    │
│  ✗ Invalid?        │
│    Build repair    │
│    prompt & retry  │──────▶  (loop up to maxRetries)
│                    │
│  ✗ All failed?     │
│    Throw error     │──────▶  AIValidationError
└────────────────────┘
```

1. **Prompt construction** — Your prompt + a JSON-Schema description of the Zod schema are combined into a system instruction.
2. **Provider call** — The prompt is sent via `AIProvider.complete()`.
3. **Safe JSON parsing** — The raw response is cleaned (markdown fences stripped, outermost JSON extracted) and parsed.
4. **Zod validation** — The parsed object is validated against your schema with `schema.safeParse()`.
5. **Repair loop** — On failure, a new prompt is built containing the previous output + error messages, asking the model to fix it. This repeats up to `maxRetries` times.
6. **Result or error** — Either a typed result is returned, or `AIValidationError` is thrown with full diagnostics.

---

## Examples

### Complex Schema

```typescript
import { z } from "zod";
import { runStructuredPrompt } from "zuai";

const RecipeSchema = z.object({
  name: z.string(),
  servings: z.number().int().positive(),
  prepTimeMinutes: z.number().min(0),
  ingredients: z.array(
    z.object({
      item: z.string(),
      quantity: z.string(),
      optional: z.boolean(),
    }),
  ),
  steps: z.array(z.string()).min(1),
  tags: z.array(z.string()),
});

type Recipe = z.infer<typeof RecipeSchema>;

const recipe: Recipe = await runStructuredPrompt({
  prompt: "Give me a recipe for banana bread.",
  schema: RecipeSchema,
});

console.log(`${recipe.name} — serves ${recipe.servings}`);
recipe.steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
```

### Custom Retry Count

```typescript
const result = await runStructuredPrompt({
  prompt: "Generate a UUID, ISO timestamp, and a score between 0-100.",
  schema: z.object({
    uuid: z.string().uuid(),
    timestamp: z.string().datetime(),
    score: z.number().int().min(0).max(100),
  }),
  maxRetries: 5, // more retries for strict validation
});
```

### Using a Different Model

```typescript
import { OpenAIProvider, runStructuredPrompt } from "zuai";

const result = await runStructuredPrompt({
  prompt: "Describe TypeScript in 3 bullet points.",
  schema: z.object({
    points: z.array(z.string()).length(3),
  }),
  provider: new OpenAIProvider({
    model: "gpt-4o-mini",
    temperature: 0.3,
  }),
});
```

### Building a Custom Provider (Anthropic)

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider } from "zuai";

class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    this.client = new Anthropic({ apiKey: opts?.apiKey });
    this.model = opts?.model ?? "claude-sonnet-4-20250514";
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error("No text response");
    return block.text;
  }
}

// Use it as a drop-in replacement:
const result = await runStructuredPrompt({
  prompt: "List 5 colours with hex codes.",
  schema: ColourSchema,
  provider: new AnthropicProvider(),
});
```

### Error Handling

```typescript
import { runStructuredPrompt, AIValidationError } from "zuai";

try {
  const result = await runStructuredPrompt({
    prompt: "Generate structured data.",
    schema: MyStrictSchema,
  });
  console.log("Success:", result);
} catch (error) {
  if (error instanceof AIValidationError) {
    console.error(`Failed after ${error.attempts} attempts`);
    console.error("Last raw output:", error.lastRawOutput);
    console.error("Validation issues:", error.validationIssues);
  } else {
    // Network error, auth error, etc.
    throw error;
  }
}
```

---

## Project Structure

```
src/
├── index.ts                     # Public API barrel export
├── types/
│   └── provider.ts              # AIProvider interface
├── errors/
│   └── ai-validation-error.ts   # AIValidationError class
├── providers/
│   └── openai-provider.ts       # OpenAI implementation
├── core/
│   ├── run-structured-prompt.ts  # Main entry function
│   └── validate-and-retry.ts    # Provider-agnostic retry loop
└── utils/
    ├── json-parser.ts           # Safe JSON extraction & parsing
    ├── prompt-builder.ts        # Prompt template construction
    └── schema-description.ts    # Zod → human-readable schema text
```

---

## Design Principles

- **Separation of concerns** — Provider logic, retry logic, JSON parsing, and prompt building are all independent modules.
- **Interface over implementation** — The core never imports OpenAI directly; it only depends on the `AIProvider` interface.
- **No `any` types** — Generics flow from the Zod schema through the entire call chain.
- **Fail loudly** — `AIValidationError` gives you everything you need to debug: the raw AI output, what went wrong, and how many attempts were made.
- **Composable utilities** — Every internal function is exported so you can build custom orchestration pipelines.

---

## Requirements

- **Node.js** >= 18
- **TypeScript** >= 5.0
- **Zod** >= 4.x

---

## License

MIT — see [LICENSE](LICENSE) for details.
