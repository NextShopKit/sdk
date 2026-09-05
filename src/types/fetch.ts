import { FetchOptions } from "./fetchResult";

export type FetchShopify = (
  query: string,
  variables?: Record<string, any>,
  options?: FetchOptions
) => Promise<any>;
