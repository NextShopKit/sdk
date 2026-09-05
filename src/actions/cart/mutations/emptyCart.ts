import { FetchShopify, ShopifyCart, CartProviderConfig } from "@t";
import { getCartQuery, removeFromCartMutation } from "@gql";
import {
  safeExtract,
  buildMetafieldIdentifiers,
  normalizeCart,
  log,
} from "@utils";

export async function emptyCart(
  fetchShopify: FetchShopify,
  cartId: string,
  config: CartProviderConfig = {}
): Promise<ShopifyCart> {
  const { productMetafields = [], variantMetafields = [] } = config;

  const productMetafieldIdentifiers = productMetafields.length
    ? buildMetafieldIdentifiers(productMetafields)
    : "";

  const variantMetafieldIdentifiers = variantMetafields.length
    ? buildMetafieldIdentifiers(variantMetafields)
    : "";

  const query = getCartQuery(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );

  const cartResponse = await fetchShopify(query, { cartId });

  const rawCart = safeExtract("emptyCart (fetch)", cartResponse?.data?.cart, {
    cartId,
    cartResponse,
  });

  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);

  const lineIds = normalizedCart.lines.map((line) => line.id);

  if (lineIds.length === 0) {
    log("[emptyCart] Cart already empty", { cartId });
    return normalizedCart;
  }

  const mutation = removeFromCartMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );

  const removeResponse = await fetchShopify(mutation, {
    cartId,
    lineIds,
  });

  const removedRawCart = removeResponse?.data?.cartLinesRemove?.cart;

  const normalizedRemovedCart = await normalizeCart(
    removedRawCart,
    config,
    fetchShopify
  );

  return safeExtract("emptyCart (remove)", normalizedRemovedCart, {
    cartId,
    lineIds,
    removeResponse,
  });
}
