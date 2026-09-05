import { FetchOptions, ShopifyClientConfig } from "@t";

export function createSharedShopify(config: ShopifyClientConfig) {
  const apiVersion = config.apiVersion || "2025-04";
  const endpoint = `https://${config.shop}/api/${apiVersion}/graphql.json`;

  // Memory cache setup
  const memoryCache = new Map<string, { timestamp: number; data: any }>();

  function generateKey(query: string, variables: Record<string, any>) {
    return JSON.stringify({ query, variables });
  }

  async function fetchShopify<T = any>(
    query: string,
    variables: Record<string, any> = {},
    options: FetchOptions = {}
  ): Promise<T> {
    const {
      useMemoryCache = config.enableMemoryCache,
      useVercelCache = config.enableVercelCache,
      cacheTtl = config.defaultCacheTtl ?? 60,
      revalidate = config.defaultRevalidate ?? 60,
    } = options;

    const key = generateKey(query, variables);
    const now = Date.now();

    // ✅ Memory cache check
    if (useMemoryCache && memoryCache.has(key)) {
      const { timestamp, data } = memoryCache.get(key)!;
      if (now - timestamp < cacheTtl * 1000) {
        return data;
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": config.token,
    };

    if (useVercelCache && typeof window === "undefined") {
      headers["Cache-Control"] =
        `s-maxage=${revalidate}, stale-while-revalidate=30`;
    }

    const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    };

    const res = await fetch(endpoint, fetchOptions);
    const json = await res.json();

    if (json.errors) {
      throw new Error(json.errors[0]?.message || "Shopify GraphQL error");
    }

    // ✅ Store in memory cache
    if (useMemoryCache) {
      memoryCache.set(key, { timestamp: now, data: json });
    }

    return json;
  }

  return {
    fetchShopify,
    clearCache: () => memoryCache.clear(),
    getCache: () => memoryCache,
  };
}
