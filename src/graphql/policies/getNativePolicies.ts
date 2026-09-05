import { NativePolicyType } from "@t";

export function getNativePoliciesQuery(types: NativePolicyType[]): string {
  const fields = types
    .map((type) => `${type} { id title handle url body }`)
    .join("\n");

  return `
    query GetNativePolicies {
      shop {
        ${fields}
      }
    }
  `;
}
