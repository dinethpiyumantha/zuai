import OpenAI from "openai";
import type { AIProvider } from "../types/provider.js";

/** Configuration accepted by `OpenAIProvider`. */
export interface OpenAIProviderConfig {
  /**
   * OpenAI API key.
   * Falls back to the `OPENAI_API_KEY` environment variable when omitted.
   */
  apiKey?: string;

  /** Model identifier (default: `"gpt-4o"`). */
  model?: string;

  /** Sampling temperature (default: `0` for deterministic output). */
  temperature?: number;

  /** Maximum tokens to generate (default: `4096`). */
  maxTokens?: number;
}

/**
 * Concrete `AIProvider` backed by the OpenAI Chat Completions API.
 *
 * Swap this out for an `AnthropicProvider`, `GeminiProvider`, or any other
 * implementation of the `AIProvider` interface — the orchestration layer
 * does not need to change.
 */
export class OpenAIProvider implements AIProvider {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor(config: OpenAIProviderConfig = {}) {
    this.client = new OpenAI({
      apiKey: config.apiKey ?? process.env["OPENAI_API_KEY"],
    });
    this.model = config.model ?? "gpt-4o";
    this.temperature = config.temperature ?? 0;
    this.maxTokens = config.maxTokens ?? 4096;
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      messages: [
        {
          role: "system",
          content:
            "You are a JSON‑only assistant. Respond with valid JSON and nothing else.",
        },
        { role: "user", content: prompt },
      ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error(
        "OpenAI returned an empty response (no content in the first choice).",
      );
    }

    return content;
  }
}
