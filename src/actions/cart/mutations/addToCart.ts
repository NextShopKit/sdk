import {
  FetchShopify,
  ShopifyCart,
  CartProviderConfig,
  LineItemInput,
} from "@t";
import { addToCartMutation } from "@gql";
import { safeExtract, buildMetafieldIdentifiers, normalizeCart } from "@utils";

export async function addToCart(
  fetchShopify: FetchShopify,
  cartId: string,
  lines: LineItemInput[],
  config: CartProviderConfig = {}
): Promise<ShopifyCart> {
  const { productMetafields = [], variantMetafields = [] } = config;

  const productMetafieldIdentifiers = productMetafields.length
    ? buildMetafieldIdentifiers(productMetafields)
    : "";

  const variantMetafieldIdentifiers = variantMetafields.length
    ? buildMetafieldIdentifiers(variantMetafields)
    : "";

  const mutation = addToCartMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );

  const response = await fetchShopify(mutation, { cartId, lines });

  const rawCart = response?.data?.cartLinesAdd?.cart;

  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);

  return safeExtract("addToCart", normalizedCart, {
    cartId,
    lines,
    config,
    response,
  });
}
