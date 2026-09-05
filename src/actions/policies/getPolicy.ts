import { getNativePoliciesQuery, getPolicyPageQuery } from "@gql";
import {
  FetchShopify,
  FetchOptions,
  FetchPolicyResult,
  GetPolicyOptions,
  NativePolicyType,
} from "@t";

const NATIVE_POLICY_TYPES: NativePolicyType[] = [
  "privacyPolicy",
  "refundPolicy",
  "shippingPolicy",
  "termsOfService",
];

export async function getPolicy(
  fetchShopify: FetchShopify,
  args: GetPolicyOptions,
  options?: FetchOptions
): Promise<FetchPolicyResult> {
  const { type, customHandles = {}, language = "en", debug = false } = args;

  const isNative = NATIVE_POLICY_TYPES.includes(type as NativePolicyType);
  const isOverridden = Boolean(customHandles[type]);

  // Handle custom override first
  if (isOverridden) {
    const handle = customHandles[type];
    const query = getPolicyPageQuery(handle);
    const json = await fetchShopify(query, {}, options);
    const page = json?.data?.page;

    if (!page) {
      if (debug) {
        console.warn(
          `[NextShopKit] Custom policy page with handle '${handle}' not found for type '${type}'.`
        );
      }
      return { data: null, error: `Page not found for handle: ${handle}` };
    }

    return {
      data: {
        type,
        id: page.id,
        title: page.title,
        handle: page.handle,
        published: Boolean(page.body),
        from: "page",
        body: page.body || "", // ✅ include raw HTML
      },
      error: null,
    };
  }

  // Handle native policy via Storefront API
  if (isNative) {
    if (language !== "en" && debug) {
      console.warn(
        `[NextShopKit] Shopify Storefront API does not localize policy titles or handles.`
      );
    }

    const query = getNativePoliciesQuery([type as NativePolicyType]);
    const json = await fetchShopify(query, {}, options);
    const policy = json?.data?.shop?.[type];

    if (!policy) {
      if (debug) {
        console.warn(
          `[NextShopKit] Native policy '${type}' not found in shop object.`
        );
      }
      return { data: null, error: `Native policy not found: ${type}` };
    }

    return {
      data: {
        type,
        id: policy.id,
        title: policy.title,
        handle: policy.handle,
        url: policy.url,
        published: Boolean(policy.body),
        from: "shop",
        body: policy.body || "", // ✅ include raw HTML
      },
      error: null,
    };
  }

  // Unknown type
  return {
    data: null,
    error: `Unknown policy type: ${type}`,
  };
}
