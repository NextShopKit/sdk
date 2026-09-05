import { FetchShopify, ShopifyCart, CartProviderConfig } from "@t";
import { removeFromCartMutation } from "@gql";
import { buildMetafieldIdentifiers, normalizeCart, safeExtract } from "@utils";

export async function removeFromCart(
  fetchShopify: FetchShopify,
  cartId: string,
  lineId: string,
  config: CartProviderConfig = {}
): Promise<ShopifyCart> {
  const { productMetafields = [], variantMetafields = [] } = config;

  const productMetafieldIdentifiers = productMetafields.length
    ? buildMetafieldIdentifiers(productMetafields)
    : "";

  const variantMetafieldIdentifiers = variantMetafields.length
    ? buildMetafieldIdentifiers(variantMetafields)
    : "";

  const mutation = removeFromCartMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );

  const removeResponse = await fetchShopify(mutation, {
    cartId,
    lineIds: [lineId],
  });

  const rawCart = removeResponse?.data?.cartLinesRemove?.cart;

  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);

  return safeExtract("removeFromCart", normalizedCart, {
    cartId,
    lineId,
    config,
    removeResponse,
  });
}
