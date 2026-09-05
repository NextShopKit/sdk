import {
  Product,
  ProductsPageInfo,
  FilterGroup,
  CustomMetafieldDefinition,
  MetafieldTransformFn,
} from "./";

export type SearchSortKey = "RELEVANCE" | "PRICE" | "CREATED_AT" | "UPDATED_AT";

export type SearchType = "PRODUCT" | "ARTICLE" | "PAGE";

export type SearchPrefixQueryType = "LAST" | "NONE";

export type SearchUnavailableProductsType = "SHOW" | "HIDE" | "LAST";

export type SearchProductFilter =
  | { available?: boolean }
  | { variantOption?: { name: string; value: string } }
  | { productMetafield: { namespace: string; key: string; value: string } }
  | { productTag: string }
  | { productType: string }
  | { price: { min?: number; max?: number } };

export interface GetSearchResultOptions {
  query: string;
  limit?: number;
  cursor?: string;
  reverse?: boolean;
  sortKey?: SearchSortKey;
  types?: SearchType[];
  productFilters?: SearchProductFilter[];
  prefix?: SearchPrefixQueryType;
  unavailableProducts?: SearchUnavailableProductsType;
  productMetafields?: CustomMetafieldDefinition[];
  variantMetafields?: CustomMetafieldDefinition[];

  options?: {
    camelizeKeys?: boolean;
    resolveFiles?: boolean;
    renderRichTextAsHtml?: boolean;
    transformProductMetafields?: MetafieldTransformFn;
    transformVariantMetafields?: MetafieldTransformFn;
  };
}

export interface FetchSearchResult {
  products: Product[];
  pageInfo: ProductsPageInfo | null;
  availableFilters?: FilterGroup[];
  totalCount?: number;
  searchTerm: string;
  error: string | null;
}
