// lib/nextshopkit/client/getProductVariants.ts

import {
  FetchShopify,
  FetchOptions,
  ProductVariantResult,
  FetchProductVariantsResult,
  GetProductVariantsOptions,
} from "@t";

import {
  normalizeMetafields,
  castMetafields,
  camelizeMetafields,
  buildMetafieldIdentifiers,
  safeParseArray,
} from "@utils";

import { getProductVariantsQuery } from "@gql";

export async function getProductVariants(
  fetchShopify: FetchShopify,
  args: GetProductVariantsOptions,
  options: FetchOptions = {}
): Promise<FetchProductVariantsResult> {
  const {
    ids,
    metafields = [],
    productMetafields = [],
    options: {
      includeProduct = false,
      resolveFiles = true,
      camelizeKeys = true,
      renderRichTextAsHtml = false,
      transformMetafields,
      transformProductMetafields,
    } = {},
  } = args;

  const defaultFields = ["id", "title"];
  const defaultProductFields = ["id", "title", "handle"];

  const fields = Array.from(
    new Set([...defaultFields, ...(args.fields ?? [])])
  );
  const productFields = Array.from(
    new Set([...defaultProductFields, ...(args.productFields ?? [])])
  );

  const variantMetafieldIdentifiers = buildMetafieldIdentifiers(metafields);
  const productMetafieldIdentifiers =
    buildMetafieldIdentifiers(productMetafields);

  const query = getProductVariantsQuery({
    includeProduct,
    variantMetafieldIdentifiers,
    productMetafieldIdentifiers,
    fields,
    productFields,
  });

  try {
    const res = await fetchShopify(query, { ids }, options);
    const nodes = res?.data?.nodes ?? [];

    const variants: ProductVariantResult[] = (
      await Promise.all(
        nodes.map(async (node: any) => {
          if (!node || node.__typename !== "ProductVariant") return null;

          const variantData: Record<string, any> = {};
          for (const field of fields) {
            if (field in node) variantData[field] = node[field];
          }

          const rawVariantMetafields = normalizeMetafields(
            node.metafields || [],
            metafields
          );
          const castedVariantMetafields =
            metafields.length > 0
              ? await castMetafields(
                  rawVariantMetafields,
                  metafields,
                  renderRichTextAsHtml,
                  transformMetafields,
                  resolveFiles,
                  fetchShopify,
                  options
                )
              : rawVariantMetafields;

          const finalVariantMetafields = camelizeKeys
            ? camelizeMetafields(castedVariantMetafields)
            : castedVariantMetafields;

          let productInfo: ProductVariantResult["product"] | undefined;

          if (includeProduct && node.product) {
            const rawProductMetafields = normalizeMetafields(
              node.product.metafields || [],
              productMetafields
            );
            const castedProductMetafields =
              productMetafields.length > 0
                ? await castMetafields(
                    rawProductMetafields,
                    productMetafields,
                    renderRichTextAsHtml,
                    transformProductMetafields,
                    resolveFiles,
                    fetchShopify,
                    options
                  )
                : rawProductMetafields;

            const finalProductMetafields = camelizeKeys
              ? camelizeMetafields(castedProductMetafields)
              : castedProductMetafields;

            const productImages = safeParseArray(
              node.product.images?.edges
            ).map((edge) => ({
              url: edge.node.url,
              altText: edge.node.altText ?? null,
            }));

            const productVariants = await Promise.all(
              safeParseArray(node.product.variants?.edges).map(async (edge) => {
                const variantNode = edge.node;
                const rawMeta = normalizeMetafields(
                  variantNode.metafields || [],
                  metafields
                );
                const casted =
                  metafields.length > 0
                    ? await castMetafields(
                        rawMeta,
                        metafields,
                        renderRichTextAsHtml,
                        transformMetafields,
                        resolveFiles,
                        fetchShopify,
                        options
                      )
                    : rawMeta;
                const finalMeta = camelizeKeys
                  ? camelizeMetafields(casted)
                  : casted;

                const nestedVariantData: Record<string, any> = {};
                for (const field of fields) {
                  if (field in variantNode)
                    nestedVariantData[field] = variantNode[field];
                }

                return {
                  id: variantNode.id,
                  title: variantNode.title,
                  price: {
                    amount: parseFloat(variantNode.priceV2.amount),
                    currencyCode: variantNode.priceV2.currencyCode,
                  },
                  compareAtPrice: variantNode.compareAtPriceV2
                    ? {
                        amount: parseFloat(variantNode.compareAtPriceV2.amount),
                        currencyCode: variantNode.compareAtPriceV2.currencyCode,
                      }
                    : null,
                  image: variantNode.image ?? null,
                  product: {
                    title: variantNode.product.title,
                    handle: variantNode.product.handle,
                  },
                  metafields: finalMeta,
                  ...nestedVariantData,
                };
              })
            );

            const productData: Record<string, any> = {};
            for (const field of productFields) {
              if (field in node.product)
                productData[field] = node.product[field];
            }

            productInfo = {
              id: node.product.id,
              title: node.product.title,
              handle: node.product.handle,
              ...productData,
              publishedAt: new Date(node.product.publishedAt),
              createdAt: new Date(node.product.createdAt),
              updatedAt: new Date(node.product.updatedAt),
              metafields: finalProductMetafields,
              images: productImages,
              variants: productVariants,
            };
          }

          return {
            id: node.id,
            title: node.title,
            price: {
              amount: parseFloat(node.priceV2.amount),
              currencyCode: node.priceV2.currencyCode,
            },
            compareAtPrice: node.compareAtPriceV2
              ? {
                  amount: parseFloat(node.compareAtPriceV2.amount),
                  currencyCode: node.compareAtPriceV2.currencyCode,
                }
              : null,
            ...variantData,
            metafields: finalVariantMetafields,
            product: productInfo,
            image: node.image ?? null,
          } satisfies ProductVariantResult;
        })
      )
    ).filter(Boolean) as ProductVariantResult[];

    return { data: variants, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}
