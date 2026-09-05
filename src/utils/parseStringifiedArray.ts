export function parseStringifiedArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (typeof parsed === "string") {
      return [parsed];
    } else {
      return [value];
    }
  } catch {
    return [value];
  }
}
