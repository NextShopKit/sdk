import {
  FetchOptions,
  GetProductOptions,
  FetchProductResult,
  GetCollectionOptions,
  FetchCollectionResult,
  GetSearchResultOptions,
  FetchSearchResult,
  LineItemInput,
  CartAttribute,
  BuyerIdentityInput,
  ShopifyCart,
  CartProviderConfig,
} from "@t";

export interface ShopifyClientConfig {
  shop: string;
  token: string;
  apiVersion?: string;

  // Optional caching defaults
  enableVercelCache?: boolean;
  enableMemoryCache?: boolean;
  defaultCacheTtl?: number;
  defaultRevalidate?: number;
}

export interface ShopifyBaseClient {
  fetchShopify: (
    query: string,
    variables?: any,
    options?: FetchOptions
  ) => Promise<any>;
  clearCache: () => void;
  getCache: () => Map<string, { timestamp: number; data: any }>;

  getProduct: (args: GetProductOptions) => Promise<FetchProductResult>;
  getCollection: (args: GetCollectionOptions) => Promise<FetchCollectionResult>;
  getSearchResult: (args: GetSearchResultOptions) => Promise<FetchSearchResult>;

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
}
