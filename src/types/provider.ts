/**
 * Core AI provider interface.
 *
 * Any AI backend (OpenAI, Anthropic, Gemini, local models, …) must implement
 * this single‑method contract.  The orchestration layer never couples to a
 * concrete SDK — only to this interface.
 */
export interface AIProvider {
  /**
   * Send a prompt to the model and receive back a raw string response.
   *
   * @param prompt  — the full prompt text (system + user combined by the caller)
   * @returns         the model's raw text output
   */
  complete(prompt: string): Promise<string>;
}
