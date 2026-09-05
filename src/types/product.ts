import { MetafieldTransformFn } from "./collections";
import { FetchResult } from "./fetchResult";
import { CustomMetafieldDefinition, ResolvedMetafieldInfo } from "./metafields";

export interface Variant {
  id: string;
  variantTitle: string;
  productTitle: string;
  price: { amount: number; currencyCode: string };
  compareAtPrice?: { amount: number; currencyCode: string } | null;
  metafields?: Record<string, Record<string, any>>;
  [key: string]: any;
}

export interface VariantEdge {
  node: {
    id: string;
    title: string;
    priceV2: { amount: string; currencyCode: string };
    compareAtPriceV2?: { amount: string; currencyCode: string } | null;
    product: {
      title: string;
      handle: string;
    };
    metafields?: { key: string; value: string }[];
  };
}

export interface Product {
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
  price: { amount: number; currencyCode: string };
  compareAtPrice?: { amount: number; currencyCode: string } | null;
  metafields?: Record<string, Record<string, any>>;
}

export type FetchProductResult = FetchResult<Product>;

export interface GetProductOptions {
  id?: string;
  handle?: string;
  fields?: ProductFields;
  variantFields?: VariantFields;
  customMetafields?: CustomMetafieldDefinition[];
  variantMetafields?: CustomMetafieldDefinition[];
  options: {
    locale?: string;
    resolveFiles?: boolean;
    renderRichTextAsHtml?: boolean;
    camelizeKeys?: boolean;
    transformVariantMetafields?: (
      raw: Record<string, Record<string, string>>,
      casted: Record<string, any>,
      definitions: ResolvedMetafieldInfo[]
    ) => Record<string, any>;
    transformMetafields?: (
      raw: Record<string, Record<string, string>>,
      casted: Record<string, any>,
      definitions: ResolvedMetafieldInfo[]
    ) => Record<string, any>;
  };
}

export type ProductFields = Array<
  | "id"
  | "handle"
  | "title"
  | "description"
  | "descriptionHtml"
  | "encodedVariantAvailability"
  | "encodedVariantExistence"
  | "isGiftCard"
  | "onlineStoreUrl"
  | "productType"
  | "publishedAt"
  | "requiresSellingPlan"
  | "tags"
  | "totalInventory"
  | "trackingParameters"
  | "vendor"
  | "createdAt"
  | "updatedAt"
>;

export type VariantFields = Array<
  | "id"
  | "title"
  | "sku"
  | "barcode"
  | "quantityAvailable"
  | "availableForSale"
  | "requiresShipping"
  | "requiresComponents"
  | "taxable"
  | "weight"
  | "weightUnit"
  | "currentlyNotInStock"
>;

export interface ProductVariantOptionsBase {
  metafields?: CustomMetafieldDefinition[];
  productMetafields?: CustomMetafieldDefinition[];

  fields?: VariantFields;
  productFields?: ProductFields;

  options?: {
    includeProduct?: boolean;
    resolveFiles?: boolean;
    camelizeKeys?: boolean;
    renderRichTextAsHtml?: boolean;
    transformMetafields?: (
      raw: Record<string, Record<string, string>>,
      casted: Record<string, any>,
      definitions: ResolvedMetafieldInfo[]
    ) => Record<string, any> | Promise<Record<string, any>>;
    transformProductMetafields?: (
      raw: Record<string, Record<string, string>>,
      casted: Record<string, any>,
      definitions: ResolvedMetafieldInfo[]
    ) => Record<string, any> | Promise<Record<string, any>>;
  };
}

export interface GetProductVariantOptions extends ProductVariantOptionsBase {
  id: string;
}

export interface ProductVariantResult {
  id: string;
  title: string;
  price: { amount: number; currencyCode: string };
  compareAtPrice?: { amount: number; currencyCode: string } | null;
  metafields?: Record<string, any>;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
    id: string;
  } | null;
  [key: string]: any;
  product?: {
    id: string;
    title: string;
    handle: string;
    publishedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    metafields?: Record<string, any>;
    images?: Array<{ url: string; altText: string | null }>;
    variants?: Array<{
      id: string;
      title: string;
      price: { amount: number; currencyCode: string };
      compareAtPrice?: { amount: number; currencyCode: string } | null;
      product: { title: string; handle: string };
      metafields?: Record<string, any>;
      image?: {
        url: string;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
        id: string;
      } | null;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
}

export type FetchProductVariantResult = FetchResult<ProductVariantResult>;
export interface GetProductVariantsOptions extends ProductVariantOptionsBase {
  ids: string[];
}
export type FetchProductVariantsResult = FetchResult<ProductVariantResult[]>;

export interface ProductFilter {
  productMetafield: {
    namespace: string;
    key: string;
    value: string;
  };
}
