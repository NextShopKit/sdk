import { FetchShopify, ShopifyCart, CartProviderConfig } from "@t";
import { applyDiscountMutation } from "@gql";
import {
  safeExtract,
  buildMetafieldIdentifiers,
  normalizeCart,
  warn,
} from "@utils";

export async function applyDiscount(
  fetchShopify: FetchShopify,
  cartId: string,
  code: string,
  config: CartProviderConfig = {}
): Promise<ShopifyCart> {
  const { productMetafields = [], variantMetafields = [] } = config;

  const productMetafieldIdentifiers = productMetafields.length
    ? buildMetafieldIdentifiers(productMetafields)
    : "";

  const variantMetafieldIdentifiers = variantMetafields.length
    ? buildMetafieldIdentifiers(variantMetafields)
    : "";

  const mutation = applyDiscountMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );

  const result = await fetchShopify(mutation, {
    cartId,
    discountCodes: [code],
  });

  const discountResult = result?.data?.cartDiscountCodesUpdate;

  if (discountResult?.userErrors?.length) {
    warn("[applyDiscount] User errors:", discountResult.userErrors);
  }

  const rawCart = discountResult?.cart;

  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);

  return safeExtract("applyDiscount", normalizedCart, {
    cartId,
    code,
    config,
    result,
  });
}
