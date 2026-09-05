import { createSharedShopify } from "@clients/createSharedShopify";

import {
  getProduct,
  getCollection,
  getSearchResult,
  cartActions,
  cartMutations,
} from "@actions";

import { ShopifyBaseClient, ShopifyClientConfig } from "@t";

export function createBaseClient(
  config: ShopifyClientConfig
): ShopifyBaseClient {
  const shared = createSharedShopify(config);

  return {
    fetchShopify: shared.fetchShopify,
    clearCache: shared.clearCache,
    getCache: shared.getCache,

    // core
    getProduct: (args) => getProduct(shared.fetchShopify, args),
    getCollection: (args) => getCollection(shared.fetchShopify, args),
    getSearchResult: (args) => getSearchResult(shared.fetchShopify, args),

    // cart
    createCart: () => cartActions.createCart(shared.fetchShopify),
    getCart: (cartId) => cartActions.getCart(shared.fetchShopify, cartId),
    addToCart: (cartId, lines) =>
      cartMutations.addToCart(shared.fetchShopify, cartId, lines),
    removeFromCart: (cartId, lineId) =>
      cartMutations.removeFromCart(shared.fetchShopify, cartId, lineId),
    updateCartItem: (cartId, lineId, quantity) =>
      cartMutations.updateCartItem(
        shared.fetchShopify,
        cartId,
        lineId,
        quantity
      ),
    emptyCart: (cartId) => cartMutations.emptyCart(shared.fetchShopify, cartId),
    applyDiscount: (cartId, code) =>
      cartMutations.applyDiscount(shared.fetchShopify, cartId, code),
    removeDiscount: (cartId) =>
      cartMutations.removeDiscount(shared.fetchShopify, cartId),
    updateCartAttributes: (cartId, attributes) =>
      cartMutations.updateCartAttributes(
        shared.fetchShopify,
        cartId,
        attributes
      ),
    updateBuyerIdentity: (cartId, buyerIdentity) =>
      cartMutations.updateBuyerIdentity(
        shared.fetchShopify,
        cartId,
        buyerIdentity
      ),
    mergeCarts: (sourceCartId, destinationCartId) =>
      cartMutations.mergeCarts(
        shared.fetchShopify,
        sourceCartId,
        destinationCartId
      ),
  };
}
