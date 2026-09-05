import { ShopifyCart, CartProviderConfig, FetchShopify, CartLine } from "@t";
import {
  normalizeMetafields,
  camelizeMetafields,
  castMetafields,
} from "@utils";

export async function normalizeCart(
  rawCart: any,
  config: CartProviderConfig,
  fetchShopify: FetchShopify
): Promise<ShopifyCart> {
  const {
    productMetafields = [],
    variantMetafields = [],
    options = {},
  } = config;

  const {
    camelizeKeys = true,
    renderRichTextAsHtml = false,
    resolveFiles = false,
    transformProductMetafields,
    transformVariantMetafields,
  } = options;

  const rawLines = rawCart?.lines?.edges ?? [];

  const resolvedLines: CartLine[] = await Promise.all(
    rawLines.map(async ({ node }: any): Promise<CartLine> => {
      const variant = node.merchandise;

      // --- Variant Metafields ---
      const rawVariant = normalizeMetafields(
        variant.metafields || [],
        variantMetafields
      );

      const castedVariant = await castMetafields(
        rawVariant,
        variantMetafields,
        renderRichTextAsHtml,
        transformVariantMetafields,
        resolveFiles,
        fetchShopify
      );

      const finalVariantMetafields = camelizeKeys
        ? camelizeMetafields(castedVariant)
        : castedVariant;

      // --- Product Metafields ---
      const product = variant.product;

      const rawProduct = normalizeMetafields(
        product.metafields || [],
        productMetafields
      );

      const castedProduct = await castMetafields(
        rawProduct,
        productMetafields,
        renderRichTextAsHtml,
        transformProductMetafields,
        resolveFiles,
        fetchShopify
      );

      const finalProductMetafields = camelizeKeys
        ? camelizeMetafields(castedProduct)
        : castedProduct;

      return {
        ...node,
        merchandise: {
          ...variant,
          metafields: finalVariantMetafields,
          product: {
            ...product,
            metafields: finalProductMetafields,
          },
        },
      };
    })
  );

  function castAmountFields(obj: any) {
    if (!obj || typeof obj !== "object") return obj;

    const parseAmount = (amountObj: any) => {
      if (amountObj?.amount && typeof amountObj.amount === "string") {
        return { ...amountObj, amount: parseFloat(amountObj.amount) };
      }
      return amountObj;
    };

    return {
      ...obj,
      cost: {
        ...obj.cost,
        subtotalAmount: parseAmount(obj.cost?.subtotalAmount),
        totalAmount: parseAmount(obj.cost?.totalAmount),
        totalTaxAmount: parseAmount(obj.cost?.totalTaxAmount),
        totalDutyAmount: parseAmount(obj.cost?.totalDutyAmount),
      },
    };
  }

  return {
    ...castAmountFields(rawCart),
    lines: resolvedLines,
  };
}
