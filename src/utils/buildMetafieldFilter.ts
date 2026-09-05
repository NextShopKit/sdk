import { ProductFilter } from "@t";

export function buildMetafieldFilter(
  namespace: string,
  key: string,
  values: string[]
): ProductFilter[] {
  return values.map((value) => ({
    productMetafield: {
      namespace,
      key,
      value,
    },
  }));
}
