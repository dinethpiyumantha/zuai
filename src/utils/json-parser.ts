/**
 * Safely extract and parse a JSON value from a raw AI response string.
 *
 * AI models sometimes wrap their JSON in markdown fences or add preamble /
 * trailing text.  This utility applies a series of heuristics to recover the
 * JSON payload before falling back to a plain `JSON.parse`.
 */

/** Result when parsing succeeds. */
export interface JsonParseSuccess {
  ok: true;
  data: unknown;
}

/** Result when parsing fails. */
export interface JsonParseFailure {
  ok: false;
  error: string;
}

export type JsonParseResult = JsonParseSuccess | JsonParseFailure;

/**
 * Try to extract the outermost JSON object or array from `raw`.
 * Returns `null` when no plausible JSON structure is found.
 */
function extractJsonSubstring(raw: string): string | null {
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Try to locate the first `{` or `[` and its matching closer.
  const startIdx = raw.search(/[{[]/);
  if (startIdx === -1) return null;

  const open = raw[startIdx];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < raw.length; i++) {
    const ch = raw[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === open) depth++;
    else if (ch === close) depth--;

    if (depth === 0) {
      return raw.slice(startIdx, i + 1);
    }
  }

  return null;
}

/**
 * Parse a raw AI response string into a JavaScript value.
 *
 * @param raw — the model's raw text output
 * @returns     a discriminated‑union result
 */
export function safeJsonParse(raw: string): JsonParseResult {
  // 1. Try the raw string directly (fastest path)
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    // fall through
  }

  // 2. Try to extract a JSON substring
  const extracted = extractJsonSubstring(raw);
  if (extracted) {
    try {
      return { ok: true, data: JSON.parse(extracted) };
    } catch {
      // fall through
    }
  }

  // 3. Nothing worked
  return {
    ok: false,
    error: `Unable to extract valid JSON from AI response. Raw output starts with: "${raw.slice(0, 120)}…"`,
  };
}
