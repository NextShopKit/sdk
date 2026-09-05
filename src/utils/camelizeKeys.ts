import { camelCase } from "lodash-es";

export function camelizeMetafields(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(camelizeMetafields);
  }

  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        camelCase(key),
        camelizeMetafields(value),
      ])
    );
  }

  // Don't transform strings or primitives
  return obj;
}
