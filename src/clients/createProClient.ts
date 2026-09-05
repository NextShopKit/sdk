import { createBaseClient } from "@clients/createBaseClient";
import { createSharedShopify } from "@clients/createSharedShopify";

import {
  getCollection,
  getSearchResult,
  getPolicies,
  getPolicy,
  getProduct,
  getProductVariant,
  getProductVariants,
} from "@actions";

import { ShopifyProClient, ShopifyClientConfig } from "@t";

export function createShopifyClient(
  config: ShopifyClientConfig
): ShopifyProClient {
  const base = createBaseClient(config); // Without cache feature
  const pro = createSharedShopify(config); // With cache feature

  return {
    ...base,

    // Core actions with cache feature
    getProduct: (args) => getProduct(pro.fetchShopify, args), // Import again to activate cache feature
    getCollection: (args) => getCollection(pro.fetchShopify, args), // Import again to activate cache feature
    getSearchResult: (args, options) =>
      getSearchResult(pro.fetchShopify, args, options),

    // Pro actions
    getPolicy: (args, options) => getPolicy(pro.fetchShopify, args, options),
    getPolicies: (args, options) =>
      getPolicies(pro.fetchShopify, args, options),
    getProductVariant: (args, options) =>
      getProductVariant(pro.fetchShopify, args, options),
    getProductVariants: (args, options) =>
      getProductVariants(pro.fetchShopify, args, options),

    // Cache actions
    clearCache: () => pro.clearCache(),
    getCache: () => pro.getCache(),
  };
}
