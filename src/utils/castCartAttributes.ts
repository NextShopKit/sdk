import {
  CartAttribute,
  CartAttributeDefinition,
  ResolvedAttributeInfo,
} from "@t";

export async function castCartAttributes(
  rawAttributes: CartAttribute[],
  definitions: CartAttributeDefinition[],
  transformCartAttributes?: (
    raw: CartAttribute[],
    casted: Record<string, any>,
    resolved: ResolvedAttributeInfo[]
  ) => Record<string, any> | Promise<Record<string, any>>
): Promise<Record<string, any>> {
  const casted: Record<string, any> = {};
  const resolved: ResolvedAttributeInfo[] = [];

  for (const def of definitions) {
    const raw = rawAttributes.find((attr) => attr.key === def.key)?.value;

    resolved.push({
      key: def.key,
      type: def.type,
      value: raw ?? "",
    });

    casted[def.key] = raw === undefined ? null : castValue(raw, def.type);
  }

  if (typeof transformCartAttributes === "function") {
    return await transformCartAttributes(rawAttributes, casted, resolved);
  }

  return casted;
}

function castValue(value: string, type: CartAttributeDefinition["type"]): any {
  switch (type) {
    case "boolean":
      return value === "true";
    case "integer":
      return parseInt(value, 10);
    case "decimal":
      return parseFloat(value);
    case "json":
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    case "date":
      return new Date(value);
    default:
      return value;
  }
}
