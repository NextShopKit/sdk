import { FetchShopify, ShopifyCart, CartProviderConfig } from "@t";
import { updateCartItemMutation } from "@gql";
import { buildMetafieldIdentifiers, normalizeCart, safeExtract } from "@utils";

export async function updateCartItem(
  fetchShopify: FetchShopify,
  cartId: string,
  lineId: string,
  quantity: number,
  config: CartProviderConfig = {}
): Promise<ShopifyCart> {
  const { productMetafields = [], variantMetafields = [] } = config;

  const productMetafieldIdentifiers = productMetafields.length
    ? buildMetafieldIdentifiers(productMetafields)
    : "";

  const variantMetafieldIdentifiers = variantMetafields.length
    ? buildMetafieldIdentifiers(variantMetafields)
    : "";

  const mutation = updateCartItemMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );

  const response = await fetchShopify(mutation, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });

  const rawCart = response?.data?.cartLinesUpdate?.cart;

  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);

  return safeExtract("updateCartItem", normalizedCart, {
    cartId,
    lineId,
    quantity,
    config,
    response,
  });
}
