export const PrimitiveTypes = [
  "single_line_text",
  "multi_line_text",
  "rich_text",
  "integer",
  "decimal",
  "true_false",
  "json",
  "date",
  "date_and_time",
  "money",
  "rating",
  "url",
  "color",
  "id",
] as const;

export const ReferenceTypes = [
  "Product",
  "Product_variant",
  "Customer",
  "Company",
  "Page",
  "Collection",
  "File",
  "Metaobject",
] as const;

export const UnitTypes = ["weight", "dimension", "volume"] as const;

export type ShopifyCustomFieldType =
  | (typeof PrimitiveTypes)[number]
  | (typeof ReferenceTypes)[number]
  | (typeof UnitTypes)[number];

export interface CustomMetafieldDefinition {
  field: string; // e.g., "custom.title"
  type: ShopifyCustomFieldType;
}

export interface ResolvedMetafieldInfo {
  key: string; // e.g., "title"
  namespace: string; // e.g., "custom"
  fullKey: string; // e.g., "custom.title"
  type: ShopifyCustomFieldType;
}

export interface CartAttributeDefinition {
  key: string; // e.g., "isGift"
  type: "string" | "boolean" | "integer" | "decimal" | "json" | "date"; // limited types
}

export interface ResolvedAttributeInfo {
  key: string;
  type: "string" | "boolean" | "integer" | "decimal" | "json" | "date";
  value: string;
}
