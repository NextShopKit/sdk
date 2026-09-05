// TODO: Test this action
import { FetchShopify, ShopifyCart, BuyerIdentityInput } from "@t";
import { updateBuyerIdentityMutation } from "@gql";
import { safeExtract } from "@utils";

export async function updateBuyerIdentity(
  fetchShopify: FetchShopify,
  cartId: string,
  buyerIdentity: BuyerIdentityInput
): Promise<ShopifyCart> {
  const response = await fetchShopify(updateBuyerIdentityMutation, {
    cartId,
    buyerIdentity,
  });

  return safeExtract(
    "updateBuyerIdentity",
    response?.data?.cartBuyerIdentityUpdate?.cart,
    {
      cartId,
      buyerIdentity,
      response,
    }
  );
}
