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
interface FetchProductResult {
    data: Product | null;
    error: string | null;
    fullResponse?: unknown;
}
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
interface FetchProductsResult {
    data: Product[];
    pageInfo: ProductsPageInfo;
    availableFilters?: FilterGroup[];
    error: string | null;
}
type ProductFilter = {
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
};
type ProductSortKey = "TITLE" | "PRICE" | "BEST_SELLING" | "CREATED" | "ID" | "MANUAL" | "RELEVANCE";
interface GetProductsOptions {
    collectionHandle: string;
    limit?: number;
    cursor?: string;
    reverse?: boolean;
    sortKey?: ProductSortKey;
    filters?: ProductFilter[];
    customMetafields?: CustomMetafieldDefinition[];
    variantMetafields?: CustomMetafieldDefinition[];
    options?: {
        camelizeKeys?: boolean;
        resolveFiles?: boolean;
        renderRichTextAsHtml?: boolean;
        transformMetafields?: (raw: Record<string, Record<string, string>>, casted: Record<string, any>, definitions: ResolvedMetafieldInfo[]) => Record<string, any> | Promise<Record<string, any>>;
        transformVariantMetafields?: (raw: Record<string, Record<string, string>>, casted: Record<string, any>, definitions: ResolvedMetafieldInfo[]) => Record<string, any>;
    };
}

interface ShopifyClientConfig {
    shop: string;
    token: string;
    apiVersion?: string;
}
declare function createShopifyClient(config: ShopifyClientConfig): {
    fetchShopify: <T = any>(query: string, variables?: Record<string, any>) => Promise<T>;
    getProduct: (args: GetProductOptions) => Promise<FetchProductResult>;
    getProducts: (args: GetProductsOptions) => Promise<FetchProductsResult>;
};

type FetchShopify = (query: string, variables?: Record<string, any>) => Promise<any>;

declare function getProduct(fetchShopify: FetchShopify, options: GetProductOptions): Promise<FetchProductResult>;

declare function getProducts(fetchShopify: FetchShopify, config: GetProductsOptions): Promise<FetchProductsResult>;

export { FetchProductResult, FetchProductsResult, GetProductOptions, GetProductsOptions, ShopifyClientConfig, createShopifyClient, getProduct, getProducts };
