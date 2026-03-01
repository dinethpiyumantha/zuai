/**
 * Pure functions that build prompt strings.
 *
 * Keeping prompt construction separate makes it easy to unit‑test and evolve
 * prompt engineering independently of retry / provider logic.
 */

/**
 * Build the initial system‑level instruction that tells the model to respond
 * with JSON conforming to a given schema description.
 */
export function buildInitialPrompt(
  userPrompt: string,
  schemaDescription: string,
): string {
  return [
    "You are a helpful assistant that ALWAYS responds with valid JSON and nothing else.",
    "Do not include any markdown formatting, code fences, or explanatory text.",
    "",
    "The JSON you return MUST conform to the following schema:",
    schemaDescription,
    "",
    "User request:",
    userPrompt,
  ].join("\n");
}

/**
 * Build a repair prompt that feeds back the model's previous (invalid) output
 * together with the validation error so it can self‑correct.
 */
export function buildRepairPrompt(
  originalPrompt: string,
  previousOutput: string,
  validationError: string,
  schemaDescription: string,
): string {
  return [
    "Your previous response was invalid.",
    "",
    "--- Previous output ---",
    previousOutput,
    "--- End previous output ---",
    "",
    "--- Validation error ---",
    validationError,
    "--- End validation error ---",
    "",
    "Please fix the output so it is valid JSON matching this schema:",
    schemaDescription,
    "",
    "Original user request for context:",
    originalPrompt,
    "",
    "Respond ONLY with the corrected JSON. No markdown, no explanation.",
  ].join("\n");
}
