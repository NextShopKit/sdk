import { FetchShopify, ShopifyCart, CartProviderConfig } from "@t";
import { buildMetafieldIdentifiers, safeExtract, normalizeCart } from "@utils";
import { getCartQuery } from "@gql";

export async function getCart(
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

  const response = await fetchShopify(query, { cartId });

  const normalizedCart = await normalizeCart(
    response?.data?.cart,
    config,
    fetchShopify
  );

  return safeExtract("normalizeCart", normalizedCart, {
    cartId,
    config,
    response,
  });
}
