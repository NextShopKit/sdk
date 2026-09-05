import {
  FetchOptions,
  FetchShopify,
  CustomMetafieldDefinition,
  ResolvedMetafieldInfo,
} from "@t";
import { castMetafieldValue, renderRichText } from "@utils";

/**
 * Casts normalized metafields to their correct types.
 * @param normalizedMetafields - Output from normalizeMetafields (nested by namespace).
 * @param definitions - Array of custom metafield definitions.
 * @param renderRichTextAsHtml - If true, rich_text fields are rendered as HTML.
 * @param transformMetafields - Optional post-processing function.
 * @param resolveFiles - Whether to resolve File GIDs into file objects.
 * @param fetchShopify - Required for resolving File types.
 * @returns A nested object with properly cast metafield values.
 */
export async function castMetafields(
  normalizedMetafields: Record<string, Record<string, string>>,
  definitions: CustomMetafieldDefinition[],
  renderRichTextAsHtml: boolean,
  transformMetafields?: (
    raw: Record<string, Record<string, string>>,
    casted: Record<string, any>,
    definitions: ResolvedMetafieldInfo[]
  ) => Record<string, any> | Promise<Record<string, any>>,
  resolveFiles: boolean = false,
  fetchShopify?: FetchShopify,
  options: FetchOptions = {}
): Promise<Record<string, any>> {
  const result: Record<string, any> = {};
  const resolvedDefs: ResolvedMetafieldInfo[] = [];
  const fileGIDs: string[] = [];

  for (const def of definitions) {
    const [namespace, key] = def.field.split(".");
    const rawValue = normalizedMetafields?.[namespace]?.[key];

    resolvedDefs.push({
      namespace,
      key,
      fullKey: def.field,
      type: def.type,
    });

    if (rawValue === undefined) continue;
    result[namespace] = result[namespace] || {};

    // Rich text HTML
    if (def.type === "rich_text" && renderRichTextAsHtml) {
      result[namespace][key] = renderRichText(rawValue);
      continue;
    }

    // File types
    if (def.type === "File" && resolveFiles) {
      const casted = castMetafieldValue(rawValue, def.type);

      if (Array.isArray(casted)) {
        fileGIDs.push(...casted);
      } else if (typeof casted === "string") {
        fileGIDs.push(casted);
      }

      result[namespace][key] = casted;
      continue;
    }

    // All other types
    result[namespace][key] = castMetafieldValue(rawValue, def.type);
  }

  // 🧩 Resolve File GIDs to actual file objects
  if (resolveFiles && fileGIDs.length > 0 && fetchShopify) {
    const { resolveShopifyFiles } = await import("./resolveShopifyFiles");
    const fileMap = await resolveShopifyFiles(fileGIDs, fetchShopify, options);

    for (const def of definitions) {
      if (def.type !== "File") continue;
      const [namespace, key] = def.field.split(".");
      const raw = result[namespace]?.[key];

      if (Array.isArray(raw)) {
        result[namespace][key] = raw.map((gid: string) => fileMap[gid] || gid);
      } else if (typeof raw === "string") {
        result[namespace][key] = fileMap[raw] || raw;
      }
    }
  }

  // 🧠 Final transformation
  if (typeof transformMetafields === "function") {
    return transformMetafields(normalizedMetafields, result, resolvedDefs);
  }

  return result;
}
