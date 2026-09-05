import type {
  Product,
  CustomMetafieldDefinition,
  ResolvedMetafieldInfo,
  FilterGroup,
} from "@t";

export type MetafieldTransformFn = (
  raw: Record<string, Record<string, string>>,
  casted: Record<string, any>,
  definitions: ResolvedMetafieldInfo[]
) => Record<string, any> | Promise<Record<string, any>>;

export type CollectionFilter =
  | { available?: boolean }
  | { variantOption?: { name: string; value: string } }
  | { productMetafield: { namespace: string; key: string; value: string } }
  | { productTag: string }
  | { productType: string }
  | { collection?: string }
  | { price: { min?: number; max?: number } };

export type CollectionSortKey =
  | "TITLE"
  | "PRICE"
  | "BEST_SELLING"
  | "CREATED"
  | "ID"
  | "MANUAL"
  | "RELEVANCE";

export interface GetCollectionOptions {
  collectionHandle?: string;
  collectionId?: string;
  includeProducts?: boolean;
  limit?: number;
  cursor?: string;
  reverse?: boolean;
  sortKey?: CollectionSortKey;
  filters?: CollectionFilter[];
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

export interface ProductsPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string | null;
  startCursor: string | null;
}

export interface FetchCollectionResult {
  products: Product[];
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
