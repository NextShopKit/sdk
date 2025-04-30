import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';

interface LineItemInput {
    variantId: string;
    quantity: number;
}
interface CartAttribute {
    key: string;
    value: string;
}
interface BuyerIdentityInput {
    email?: string;
    phone?: string;
    countryCode?: string;
    customerAccessToken?: string;
}
interface CartLine {
    id: string;
    quantity: number;
    merchandise: {
        id: string;
        title: string;
        product: {
            title: string;
            handle: string;
            metafields?: Array<{
                key: string;
                value: string;
            }>;
        };
        image?: {
            url: string;
            altText?: string;
        };
        price: {
            amount: string;
            currencyCode: string;
        };
    };
}
interface CartCost {
    totalAmount: {
        amount: string;
        currencyCode: string;
    };
}
interface ShopifyCart {
    id: string;
    checkoutUrl: string;
    lines: CartLine[];
    cost: CartCost;
    attributes?: CartAttribute[];
    buyerIdentity?: BuyerIdentityInput;
}

type ShopifyClient = ShopifyBaseClient;

interface ShopifyBaseClient {
    fetchShopify: (query: string, variables?: any, options?: FetchOptions) => Promise<any>;
    clearCache: () => void;
    getCache: () => Map<string, {
        timestamp: number;
        data: any;
    }>;
    getProduct: (args: GetProductOptions) => Promise<FetchProductResult>;
    getCollection: (args: GetCollectionOptions) => Promise<FetchCollectionResult>;
    createCart: () => Promise<ShopifyCart>;
    getCart: (cartId: string) => Promise<ShopifyCart>;
    addToCart: (cartId: string, lines: LineItemInput[]) => Promise<ShopifyCart>;
    addMultipleLines: (cartId: string, lines: LineItemInput[]) => Promise<ShopifyCart>;
    removeFromCart: (cartId: string, lineId: string) => Promise<ShopifyCart>;
    updateCartItem: (cartId: string, lineId: string, quantity: number) => Promise<ShopifyCart>;
    emptyCart: (cartId: string) => Promise<ShopifyCart>;
    applyDiscount: (cartId: string, code: string) => Promise<ShopifyCart>;
    removeDiscount: (cartId: string) => Promise<ShopifyCart>;
    updateCartAttributes: (cartId: string, attributes: CartAttribute[]) => Promise<ShopifyCart>;
    updateBuyerIdentity: (cartId: string, buyerIdentity: BuyerIdentityInput) => Promise<ShopifyCart>;
    mergeCarts: (sourceCartId: string, destinationCartId: string) => Promise<ShopifyCart>;
}

type MetafieldTransformFn = (raw: Record<string, Record<string, string>>, casted: Record<string, any>, definitions: ResolvedMetafieldInfo[]) => Record<string, any> | Promise<Record<string, any>>;
interface GetCollectionOptions {
    collectionHandle?: string;
    collectionId?: string;
    includeProducts?: boolean;
    limit?: number;
    cursor?: string;
    reverse?: boolean;
    sortKey?: "TITLE" | "PRICE" | "BEST_SELLING" | "CREATED" | "ID" | "MANUAL" | "RELEVANCE";
    filters?: ({
        available?: boolean;
    } | {
        variantOption?: {
            name: string;
            value: string;
        };
    } | {
        productMetafield: {
            namespace: string;
            key: string;
            value: string;
        };
    } | {
        productTag: string;
    } | {
        productType: string;
    } | {
        collection?: string;
    } | {
        price: {
            min?: number;
            max?: number;
        };
    })[];
    productMetafields?: CustomMetafieldDefinition[];
    collectionMetafields?: CustomMetafieldDefinition[];
    variantMetafields?: CustomMetafieldDefinition[];
    options?: {
        camelizeKeys?: boolean;
        resolveFiles?: boolean;
        renderRichTextAsHtml?: boolean;
        transformCollectionMetafields?: MetafieldTransformFn;
        transformProductMetafields?: MetafieldTransformFn;
        transformVariantMetafields?: MetafieldTransformFn;
    };
}
interface ProductsPageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    endCursor: string | null;
    startCursor: string | null;
}
interface FetchCollectionResult {
    data: Product[];
    pageInfo: ProductsPageInfo | null;
    availableFilters?: FilterGroup[];
    collectionMetafields?: Record<string, any>;
    error: string | null;
    collection?: {
        id: string;
        title: string;
        handle: string;
        descriptionHtml: string;
        description: string;
        updatedAt: Date | null;
        seo: {
            title: string | null;
            description: string | null;
        };
        image: {
            originalSrc: string;
            altText: string | null;
        } | null;
    };
}

interface FetchResult<T> {
    data: T | null;
    error: string | null;
    fullResponse?: unknown;
}
type FetchOptions = {
    cacheTtl?: number;
    revalidate?: number;
    useMemoryCache?: boolean;
    useVercelCache?: boolean;
};

declare const PrimitiveTypes: readonly ["single_line_text", "multi_line_text", "rich_text", "integer", "decimal", "true_false", "json", "date", "date_and_time", "money", "rating", "url", "color", "id"];
declare const ReferenceTypes: readonly ["Product", "Product_variant", "Customer", "Company", "Page", "Collection", "File", "Metaobject"];
declare const UnitTypes: readonly ["weight", "dimension", "volume"];
type ShopifyCustomFieldType = (typeof PrimitiveTypes)[number] | (typeof ReferenceTypes)[number] | (typeof UnitTypes)[number];
interface CustomMetafieldDefinition {
    field: string;
    type: ShopifyCustomFieldType;
}
interface ResolvedMetafieldInfo {
    key: string;
    namespace: string;
    fullKey: string;
    type: ShopifyCustomFieldType;
}

interface Variant {
    id: string;
    variantTitle: string;
    productTitle: string;
    price: {
        amount: number;
        currencyCode: string;
    };
    compareAtPrice?: {
        amount: number;
        currencyCode: string;
    } | null;
    metafields?: Record<string, Record<string, any>>;
}
interface Product {
    id: string;
    title: string;
    handle: string;
    descriptionHtml: string;
    featuredImage: {
        originalSrc: string;
        altText: string | null;
    } | null;
    images: Array<{
        originalSrc: string;
        altText: string | null;
    }>;
    variants: Variant[];
    price: {
        amount: number;
        currencyCode: string;
    };
    compareAtPrice?: {
        amount: number;
        currencyCode: string;
    } | null;
    metafields?: Record<string, Record<string, any>>;
}
type FetchProductResult = FetchResult<Product>;
interface GetProductOptions {
    id?: string;
    handle?: string;
    customMetafields?: CustomMetafieldDefinition[];
    variantMetafields?: CustomMetafieldDefinition[];
    options: {
        locale?: string;
        resolveFiles?: boolean;
        renderRichTextAsHtml?: boolean;
        camelizeKeys?: boolean;
        transformVariantMetafields?: (raw: Record<string, Record<string, string>>, casted: Record<string, any>, definitions: ResolvedMetafieldInfo[]) => Record<string, any>;
        transformMetafields?: (raw: Record<string, Record<string, string>>, casted: Record<string, any>, definitions: ResolvedMetafieldInfo[]) => Record<string, any>;
    };
}

interface FilterValue {
    id: string;
    label: string;
    count: number;
}
interface FilterGroup {
    id: string;
    label: string;
    values: FilterValue[];
}

interface CartContextType {
    cart: ShopifyCart | null;
    loading: boolean;
    addProducts: (lines: LineItemInput[]) => Promise<void>;
    addMultipleProducts: (lines: LineItemInput[]) => Promise<void>;
    removeProduct: (lineId: string) => Promise<void>;
    updateQuantity: (lineId: string, quantity: number) => Promise<void>;
    applyDiscountCode: (code: string) => Promise<void>;
    removeDiscountCode: () => Promise<void>;
    emptyCart: () => Promise<void>;
    mergeCarts: (sourceCartId: string) => Promise<void>;
    updateBuyerIdentity: (buyerIdentity: BuyerIdentityInput) => Promise<void>;
    updateCartAttributes: (attributes: CartAttribute[]) => Promise<void>;
    resetCart: () => Promise<void>;
    totalCount: number;
    totalPrice: number;
}
declare function CartProvider({ children, client, }: {
    children: ReactNode;
    client: ShopifyClient;
}): react_jsx_runtime.JSX.Element;

declare function useCart(): CartContextType;

export { CartProvider, useCart };
