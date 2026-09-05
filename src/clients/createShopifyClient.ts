import { createBaseClient } from "@clients/createBaseClient";
import { ShopifyClient, ShopifyClientConfig } from "@t";

export function createShopifyClient(
  config: ShopifyClientConfig
): ShopifyClient {
  return createBaseClient(config);
}
