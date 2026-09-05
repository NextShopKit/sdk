import { CustomMetafieldDefinition } from "@t";

type Metafield = { key: string; value: string };

export function normalizeMetafields(
  metafields: (Metafield | null)[],
  definitions: CustomMetafieldDefinition[]
): Record<string, any> {
  const result: Record<string, any> = {};

  // Map: key -> namespace (from definitions like "custom.title")
  const keyToNamespace = new Map<string, string>();
  for (const def of definitions) {
    const [namespace, key] = def.field.split(".");
    keyToNamespace.set(key, namespace);
  }

  for (const field of metafields) {
    if (!field?.key) continue;

    // Fix: Remove namespace if included in metafield.key
    const key = field.key.includes(".")
      ? field.key.split(".").pop()!
      : field.key;
    const namespace = keyToNamespace.get(key) || "global";

    if (!result[namespace]) {
      result[namespace] = {};
    }

    result[namespace][key] = field.value;
  }

  return result;
}
