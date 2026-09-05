export function tryParseArrayOrReturnOriginal(
  value: string
): string | string[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    return value;
  } catch {
    return value;
  }
}
