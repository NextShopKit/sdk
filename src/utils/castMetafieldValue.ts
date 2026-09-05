import { ShopifyCustomFieldType } from "@t";
import { tryParseArrayOrReturnOriginal, parseStringifiedArray } from "@utils";

function castSingleValue(value: string, type: ShopifyCustomFieldType): unknown {
  switch (type) {
    case "integer":
    case "decimal":
    case "money":
    case "rating":
    case "weight":
    case "volume":
    case "dimension":
      return Number(value);

    case "true_false":
      return value === "true";

    case "json":
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }

    case "date":
    case "date_and_time":
      return new Date(value);

    case "Product":
    case "Product_variant":
    case "Customer":
    case "Company":
    case "Page":
    case "Collection":
    case "File":
    case "Metaobject":
      return value;

    default:
      return value;
  }
}

export function castMetafieldValue(
  rawValue: string,
  type: ShopifyCustomFieldType
): unknown {
  const parsed = tryParseArrayOrReturnOriginal(rawValue);

  if (Array.isArray(parsed)) {
    return parsed.map((item) =>
      typeof item === "string" ? castSingleValue(item, type) : item
    );
  }

  return castSingleValue(parsed, type);
}
