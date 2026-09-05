import { FetchShopify, ShopifyCart, CartProviderConfig } from "@t";
import { mergeCartsMutation } from "@gql";
import { buildMetafieldIdentifiers, normalizeCart, safeExtract } from "@utils";

export async function mergeCarts(
  fetchShopify: FetchShopify,
  sourceCartId: string,
  destinationCartId: string,
  config: CartProviderConfig = {}
): Promise<ShopifyCart> {
  const { productMetafields = [], variantMetafields = [] } = config;

  const productMetafieldIdentifiers = productMetafields.length
    ? buildMetafieldIdentifiers(productMetafields)
    : "";

  const variantMetafieldIdentifiers = variantMetafields.length
    ? buildMetafieldIdentifiers(variantMetafields)
    : "";

  const mutation = mergeCartsMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );

  const response = await fetchShopify(mutation, {
    sourceCartId,
    destinationCartId,
  });

  const rawCart = response?.data?.cartMerge?.cart;

  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);

  return safeExtract("mergeCarts", normalizedCart, {
    sourceCartId,
    destinationCartId,
    config,
    response,
  });
}
