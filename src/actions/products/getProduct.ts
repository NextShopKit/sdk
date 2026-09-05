import {
  ImageEdge,
  FetchShopify,
  Product,
  VariantEdge,
  FetchProductResult,
  GetProductOptions,
  Variant,
  FetchOptions,
  ProductFields,
  VariantFields,
} from "@t";

import {
  castMetafields,
  safeParseArray,
  camelizeMetafields,
  normalizeMetafields,
  buildMetafieldIdentifiers,
} from "@utils";

import { getProductByIdQuery, getProductByHandleQuery } from "@gql";

export async function getProduct(
  fetchShopify: FetchShopify,
  args: GetProductOptions,
  options?: FetchOptions
): Promise<FetchProductResult> {
  const {
    handle,
    id,
    fields,
    variantFields,
    customMetafields = [],
    variantMetafields = [],
    options: settings,
  } = args;

  const defaultFields: ProductFields = [
    "id",
    "title",
    "handle",
    "descriptionHtml",
  ];
  const defaultVariantFields: VariantFields = ["id", "title"];

  const uniqueFields = Array.from(
    new Set([...defaultFields, ...(fields ?? [])])
  );
  const uniqueVariantFields = Array.from(
    new Set([...defaultVariantFields, ...(variantFields ?? [])])
  );

  const {
    locale,
    renderRichTextAsHtml = false,
    camelizeKeys = true,
    resolveFiles = true,
    transformMetafields,
    transformVariantMetafields,
  } = settings;

  if (!handle && !id) {
    return { data: null, error: "Either handle or id must be provided" };
  }

  const productMetafieldIdentifiers =
    customMetafields.length > 0
      ? buildMetafieldIdentifiers(customMetafields)
      : "";

  const variantMetafieldIdentifiers =
    variantMetafields.length > 0
      ? buildMetafieldIdentifiers(variantMetafields)
      : "";

  const query = id
    ? getProductByIdQuery(
        uniqueFields,
        uniqueVariantFields,
        productMetafieldIdentifiers,
        variantMetafieldIdentifiers
      )
    : getProductByHandleQuery(
        uniqueFields,
        uniqueVariantFields,
        productMetafieldIdentifiers,
        variantMetafieldIdentifiers
      );

  const variables = id ? { id } : { handle, locale };

  try {
    const json = await fetchShopify(query, variables, options);

    if (json.errors?.length) {
      return {
        data: null,
        error: json.errors[0]?.message || "GraphQL error",
      };
    }

    const node = id ? json.data?.node : json.data?.productByHandle;
    if (!node) {
      return { data: null, error: "Product not found" };
    }

    const productData: Record<string, any> = {};
    for (const field of uniqueFields) {
      if (field in node) {
        productData[field] = node[field];
      }
    }

    const rawMetafields = normalizeMetafields(
      node.metafields || [],
      customMetafields
    );

    const castedMetafields =
      customMetafields.length > 0
        ? await castMetafields(
            rawMetafields,
            customMetafields,
            renderRichTextAsHtml,
            transformMetafields,
            resolveFiles,
            fetchShopify,
            options
          )
        : rawMetafields;

    const metafields =
      camelizeKeys !== false
        ? camelizeMetafields(castedMetafields)
        : castedMetafields;

    const images = safeParseArray<ImageEdge>(node.images?.edges).map(
      (edge) => ({
        originalSrc: edge.node.originalSrc,
        altText: edge.node.altText ?? null,
      })
    );

    const variants: Variant[] = await Promise.all(
      safeParseArray<VariantEdge>(node.variants?.edges).map(async (edge) => {
        const variant = edge.node;

        const rawVariantMetafields = normalizeMetafields(
          variant.metafields || [],
          variantMetafields
        );

        const castedVariantMetafields =
          variantMetafields.length > 0
            ? await castMetafields(
                rawVariantMetafields,
                variantMetafields,
                renderRichTextAsHtml,
                transformVariantMetafields,
                resolveFiles,
                fetchShopify,
                options
              )
            : rawVariantMetafields;

        const finalVariantMetafields =
          camelizeKeys !== false
            ? camelizeMetafields(castedVariantMetafields)
            : castedVariantMetafields;

        type RawVariantFields =
          | VariantFields[number]
          | "priceV2"
          | "compareAtPriceV2"
          | "product"
          | "metafields";

        const variantTyped = variant as Record<RawVariantFields, any>;

        const variantData: Record<string, any> = {};
        for (const field of uniqueVariantFields) {
          if (field in variantTyped) {
            variantData[field] = variantTyped[field];
          }
        }

        return {
          ...variantData,
          id: variant.id,
          productTitle: variant.product?.title || node.title,
          variantTitle:
            variant.title === "Default Title" ? node.title : variant.title,
          price: {
            amount: parseFloat(variant.priceV2.amount),
            currencyCode: variant.priceV2.currencyCode,
          },
          compareAtPrice: variant.compareAtPriceV2
            ? {
                amount: parseFloat(variant.compareAtPriceV2.amount),
                currencyCode: variant.compareAtPriceV2.currencyCode,
              }
            : null,
          metafields: finalVariantMetafields,
        };
      })
    );

    const defaultPrice = variants[0]?.price ?? {
      amount: 0,
      currencyCode: "EUR",
    };

    const defaultCompareAtPrice = variants[0]?.compareAtPrice ?? null;

    const product: Product = {
      ...productData,
      id: node.id,
      title: node.title,
      handle: node.handle,
      descriptionHtml: node.descriptionHtml || "",
      featuredImage: node.featuredImage || null,
      images,
      variants,
      price: defaultPrice,
      compareAtPrice: defaultCompareAtPrice,
      metafields,
    };

    return { data: product, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}
