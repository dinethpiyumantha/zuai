import type { ZodType } from "zod";

/**
 * Produce a human‑/model‑readable description of a Zod schema.
 *
 * We serialise the schema's JSON‑Schema representation so the model gets a
 * precise structural specification rather than a prose description.
 */
export function describeSchema(schema: ZodType): string {
  // Zod ≥ 3.21 exposes a .toJsonSchema() method.  For earlier versions we
  // fall back to a simple stringification of the schema's internal shape.
  try {
    // Attempt the built-in JSON Schema conversion that ships with modern Zod
    if ("toJsonSchema" in schema && typeof schema.toJsonSchema === "function") {
      return JSON.stringify(schema.toJsonSchema(), null, 2);
    }
  } catch {
    // fall through
  }

  // Fallback: pretty-print the Zod description if available, or the shape
  if (schema.description) {
    return schema.description;
  }

  // Last resort — just stringify the shape property which most Zod objects have
  try {
    const shape = (schema as unknown as Record<string, unknown>)["shape"];
    if (shape) {
      return JSON.stringify(shape, null, 2);
    }
  } catch {
    // fall through
  }

  return "(schema description unavailable — please return valid JSON)";
}
