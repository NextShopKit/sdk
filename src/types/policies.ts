import type { PaginatedResult } from "./fetchResult";

// Native Shopify policies available via Storefront API
export type NativePolicyType =
  | "privacyPolicy"
  | "refundPolicy"
  | "shippingPolicy"
  | "termsOfService";

// Custom/extended policies fetched via Pages API (user-defined)
export type CustomPolicyType = string;

export type PolicyType = NativePolicyType | CustomPolicyType;

export type PolicySource = "shop" | "page";

// Single policy entry returned from getPolicies
export interface PolicyEntry {
  type: PolicyType;
  title: string;
  handle: string;
  id: string;
  published: boolean;
  from: PolicySource;
  url?: string; // Only present if source is 'shop'
  body?: string; // Only present in getPolicy()
}


// Fetch function input
export interface GetPoliciesOptions {
  language?: string; // Default: 'en'
  customHandles?: Record<string, string>; // e.g. { legalNotice: "mentions-legales" }
  policyTypes?: PolicyType[]; // Optional, now auto-merged with customHandles
  debug?: boolean;
}

// Standardized fetch result
export type FetchPoliciesResult = PaginatedResult<PolicyEntry>;

export interface GetPolicyOptions {
  type: PolicyType;
  customHandles?: Record<string, string>; // same as in getPolicies
  language?: string;
  debug?: boolean;
}

export interface FetchPolicyResult {
  data: PolicyEntry | null;
  error: string | null;
  fullResponse?: unknown;
}
