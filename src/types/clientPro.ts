import {
  FetchOptions,
  GetProductOptions,
  GetCollectionOptions,
  GetSearchResultOptions,
  GetPoliciesOptions,
  GetPolicyOptions,
  GetProductVariantOptions,
  GetProductVariantsOptions,
  FetchProductResult,
  FetchCollectionResult,
  FetchSearchResult,
  FetchPoliciesResult,
  FetchPolicyResult,
  FetchProductVariantResult,
  FetchProductVariantsResult,
  LineItemInput,
  CartAttribute,
  BuyerIdentityInput,
  ShopifyCart,
  CartProviderConfig,
} from "@t";

export interface ShopifyProClient {
  // Base fetcher + caching
  fetchShopify: (
    query: string,
    variables?: any,
    options?: FetchOptions
  ) => Promise<any>;
  clearCache: () => void;
  getCache: () => Map<string, { timestamp: number; data: any }>;

  // Core (with options support)
  getProduct: (
    args: GetProductOptions,
    options?: FetchOptions
  ) => Promise<FetchProductResult>;
  getCollection: (
    args: GetCollectionOptions,
    options?: FetchOptions
  ) => Promise<FetchCollectionResult>;
  getSearchResult: (
    args: GetSearchResultOptions,
    options?: FetchOptions
  ) => Promise<FetchSearchResult>;

  // Cart methods
  createCart: () => Promise<ShopifyCart>;
  getCart(cartId: string, config?: CartProviderConfig): Promise<ShopifyCart>;
  addToCart: (
    cartId: string,
    lines: LineItemInput[],
    config?: CartProviderConfig
  ) => Promise<ShopifyCart>;
  removeFromCart: (cartId: string, lineId: string) => Promise<ShopifyCart>;
  updateCartItem: (
    cartId: string,
    lineId: string,
    quantity: number
  ) => Promise<ShopifyCart>;
  emptyCart: (cartId: string) => Promise<ShopifyCart>;
  applyDiscount: (cartId: string, code: string) => Promise<ShopifyCart>;
  removeDiscount: (cartId: string) => Promise<ShopifyCart>;
  updateCartAttributes: (
    cartId: string,
    attributes: CartAttribute[]
  ) => Promise<ShopifyCart>;
  updateBuyerIdentity: (
    cartId: string,
    buyerIdentity: BuyerIdentityInput
  ) => Promise<ShopifyCart>;
  mergeCarts: (
    sourceCartId: string,
    destinationCartId: string
  ) => Promise<ShopifyCart>;

  // Pro-only methods
  getPolicy: (
    args: GetPolicyOptions,
    options?: FetchOptions
  ) => Promise<FetchPolicyResult>;
  getPolicies: (
    args?: GetPoliciesOptions,
    options?: FetchOptions
  ) => Promise<FetchPoliciesResult>;
  getProductVariant: (
    args: GetProductVariantOptions,
    options?: FetchOptions
  ) => Promise<FetchProductVariantResult>;
  getProductVariants: (
    args: GetProductVariantsOptions,
    options?: FetchOptions
  ) => Promise<FetchProductVariantsResult>;
}
