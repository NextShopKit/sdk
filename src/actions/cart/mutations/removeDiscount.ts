import { FetchShopify, ShopifyCart, CartProviderConfig } from "@t";
import { removeDiscountMutation } from "@gql";
import { buildMetafieldIdentifiers, normalizeCart, safeExtract } from "@utils";

export async function removeDiscount(
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

  const mutation = removeDiscountMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );

  const response = await fetchShopify(mutation, { cartId });

  const rawCart = response?.data?.cartDiscountCodesUpdate?.cart;

  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);

  return safeExtract("removeDiscount", normalizedCart, {
    cartId,
    config,
    response,
  });
}
