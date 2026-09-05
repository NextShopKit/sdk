import { FetchShopify, ShopifyCart, CartProviderConfig } from "@t";
import { createCartMutation } from "@gql";
import { safeExtract } from "@utils";

export async function createCart(
  fetchShopify: FetchShopify,
  config?: CartProviderConfig
): Promise<ShopifyCart> {
  const attributes = config?.customAttributes ?? [];

  const response = await fetchShopify(createCartMutation, {
    attributes,
  });

  const cart = response?.data?.cartCreate?.cart;

  return safeExtract("createCart", cart, {
    config,
    attributes,
    response,
  });
}
