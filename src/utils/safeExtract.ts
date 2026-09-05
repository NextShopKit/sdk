import { debug, error } from "@utils";

/**
 * Safely extract a nested value from a GraphQL response.
 * Logs and throws (in dev) if the value is missing.
 */
export function safeExtract<T>(
  label: string,
  value: T | undefined | null,
  context?: Record<string, unknown>
): T {
  if (!value) {
    error(`[${label}] Response missing or invalid`, context);

    if (process.env.NODE_ENV === "development") {
      throw new Error(`[${label}] Missing or undefined value`);
    }
  }

  if (process.env.NODE_ENV === "development") {
    debug(`[${label}] Success`, value);
  }

  return value as T;
}
