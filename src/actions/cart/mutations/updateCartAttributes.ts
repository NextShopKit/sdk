import {
  FetchShopify,
  ShopifyCart,
  CartProviderConfig,
  CartAttribute,
} from "@t";
import { updateCartAttributesMutation } from "@gql";
import { buildMetafieldIdentifiers, normalizeCart, safeExtract } from "@utils";

export async function updateCartAttributes(
  fetchShopify: FetchShopify,
  cartId: string,
  attributes: CartAttribute[],
  config: CartProviderConfig = {}
): Promise<ShopifyCart> {
  const { productMetafields = [], variantMetafields = [] } = config;

  const productMetafieldIdentifiers = productMetafields.length
    ? buildMetafieldIdentifiers(productMetafields)
    : "";

  const variantMetafieldIdentifiers = variantMetafields.length
    ? buildMetafieldIdentifiers(variantMetafields)
    : "";

  const mutation = updateCartAttributesMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );

  const response = await fetchShopify(mutation, {
    cartId,
    attributes,
  });

  const rawCart = response?.data?.cartAttributesUpdate?.cart;

  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);

  return safeExtract("updateCartAttributes", normalizedCart, {
    cartId,
    attributes,
    config,
    response,
  });
}
