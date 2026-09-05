import { getNativePoliciesQuery, getPolicyPageQuery } from "@gql";
import {
  FetchShopify,
  FetchOptions,
  FetchPoliciesResult,
  GetPoliciesOptions,
  NativePolicyType,
  PolicyEntry,
  PolicyType,
} from "@t";

const NATIVE_POLICY_TYPES: NativePolicyType[] = [
  "privacyPolicy",
  "refundPolicy",
  "shippingPolicy",
  "termsOfService",
];

export async function getPolicies(
  fetchShopify: FetchShopify,
  args: GetPoliciesOptions = {},
  options?: FetchOptions
): Promise<FetchPoliciesResult> {
  const {
    language = "en",
    customHandles = {},
    policyTypes: userDefinedTypes = NATIVE_POLICY_TYPES,
    debug = false,
  } = args;

  // ✅ Merge user-defined types and customHandles keys
  const policyTypes: PolicyType[] = Array.from(
    new Set([...userDefinedTypes, ...Object.keys(customHandles)])
  );

  const entries: PolicyEntry[] = [];

  const nativeToFetch = policyTypes.filter(
    (type) =>
      NATIVE_POLICY_TYPES.includes(type as NativePolicyType) &&
      !customHandles[type]
  ) as NativePolicyType[];

  let nativeData: Record<string, any> = {};

  if (nativeToFetch.length > 0) {
    if (language !== "en" && debug) {
      console.warn(
        `[NextShopKit] Shopify Storefront API does not localize policy titles or handles. Only body/url may reflect the Accept-Language header.`
      );
    }

    const query = getNativePoliciesQuery(nativeToFetch);
    const json = await fetchShopify(query, {}, options);
    nativeData = json?.data?.shop ?? {};
  }

  for (const type of nativeToFetch) {
    const policy = nativeData[type];
    if (!policy) {
      if (debug) {
        console.warn(
          `[NextShopKit] Native policy '${type}' was not returned by Shopify.`
        );
      }
      continue;
    }

    entries.push({
      type,
      id: policy.id,
      title: policy.title,
      handle: policy.handle,
      url: policy.url,
      published: Boolean(policy.body),
      from: "shop",
    });
  }

  for (const [type, handle] of Object.entries(customHandles)) {
    if (debug && NATIVE_POLICY_TYPES.includes(type as NativePolicyType)) {
      console.info(
        `[NextShopKit] Overriding native policy '${type}' with custom page '${handle}'.`
      );
    }

    const query = getPolicyPageQuery(handle);
    const json = await fetchShopify(query, {}, options);
    const page = json?.data?.page;

    if (!page) {
      if (debug) {
        console.warn(
          `[NextShopKit] Custom policy page with handle '${handle}' not found for type '${type}'.`
        );
      }
      continue;
    }

    entries.push({
      type,
      id: page.id,
      title: page.title,
      handle: page.handle,
      published: Boolean(page.body),
      from: "page",
    });
  }

  return {
    data: entries,
    error: null,
    pageInfo: null,
    fullResponse: undefined,
  };
}
