import {
  CartAttributeDefinition,
  CustomMetafieldDefinition,
  ResolvedAttributeInfo,
  ResolvedMetafieldInfo,
  ShopifyClient,
} from "@t";
import { ReactNode } from "react";

export interface LineItemInput {
  merchandiseId: string;
  quantity: number;
}

export interface CartAttribute {
  key: string;
  value: string;
}

export interface BuyerIdentityInput {
  email?: string;
  phone?: string;
  countryCode?: string;
  customerAccessToken?: string;
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      title: string;
      handle: string;
      metafields?: Array<{ key: string; value: string }>;
    };
    image?: { url: string; altText?: string };
    price: { amount: string; currencyCode: string };
  };
}

export interface CartCost {
  totalAmount: { amount: number; currencyCode: string };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  lines: CartLine[];
  cost: CartCost;
  attributes?: CartAttribute[];
  buyerIdentity?: BuyerIdentityInput;
}

export interface CartProviderConfig {
  customAttributes?: CartAttributeDefinition[];
  productMetafields?: CustomMetafieldDefinition[];
  variantMetafields?: CustomMetafieldDefinition[];
  options?: {
    lineLimit?: number;
    resolveFiles?: boolean;
    renderRichTextAsHtml?: boolean;
    camelizeKeys?: boolean;
    transformCartAttributes?: (
      raw: CartAttribute[],
      casted: Record<string, any>,
      resolved: ResolvedAttributeInfo[]
    ) => Record<string, any> | Promise<Record<string, any>>;
    transformVariantMetafields?: (
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

export interface CartProviderProps {
  children: ReactNode;
  client: ShopifyClient;
  debug?: boolean;
  config?: CartProviderConfig;
}
