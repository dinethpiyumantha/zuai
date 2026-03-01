// ── Public API ───────────────────────────────────────────────────────────────

// Core function
export {
  runStructuredPrompt,
  type RunStructuredPromptOptions,
} from "./core/run-structured-prompt.js";

// Provider interface + built‑in implementation
export type { AIProvider } from "./types/provider.js";
export {
  OpenAIProvider,
  type OpenAIProviderConfig,
} from "./providers/openai-provider.js";

// Error class
export { AIValidationError } from "./errors/ai-validation-error.js";

// Utilities (advanced usage / testing)
export { safeJsonParse } from "./utils/json-parser.js";
export {
  buildInitialPrompt,
  buildRepairPrompt,
} from "./utils/prompt-builder.js";
export { describeSchema } from "./utils/schema-description.js";
