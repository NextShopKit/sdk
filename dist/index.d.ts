interface FetchResult<T> {
    data: T | null;
    error: string | null;
    fullResponse?: unknown;
}

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

type MetafieldTransformFn = (raw: Record<string, Record<string, string>>, casted: Record<string, any>, definitions: ResolvedMetafieldInfo[]) => Record<string, any> | Promise<Record<string, any>>;
interface GetCollectionOptions {
    collectionHandle: string;
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
interface FetchCollectionResult {
    data: Product[];
    pageInfo: ProductsPageInfo | null;
    availableFilters?: FilterGroup[];
    collectionMetafields?: Record<string, any>;
    error: string | null;
}

interface ShopifyClientConfig {
    shop: string;
    token: string;
    apiVersion?: string;
}

declare function createShopifyClient(config: ShopifyClientConfig): {
    fetchShopify: <T = any>(query: string, variables?: Record<string, any>) => Promise<T>;
    getProduct: (args: GetProductOptions) => Promise<FetchProductResult>;
    getCollection: (args: GetCollectionOptions) => Promise<FetchCollectionResult>;
};

export { FetchCollectionResult, FetchProductResult, GetCollectionOptions, GetProductOptions, createShopifyClient };
