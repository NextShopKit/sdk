export function safeParseArray<T = any>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}
