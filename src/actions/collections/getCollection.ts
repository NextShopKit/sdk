import {
  FetchShopify,
  Product,
  Variant,
  VariantEdge,
  FilterGroup,
  GetCollectionOptions,
  FetchCollectionResult,
  ProductsPageInfo,
  FetchOptions,
} from "@t";

import {
  castMetafields,
  safeParseArray,
  camelizeMetafields,
  normalizeMetafields,
  buildMetafieldIdentifiers,
  formatAvailableFilters,
  formatGID,
} from "@utils";

import { getCollectionProductsQuery } from "@gql";

export async function getCollection(
  fetchShopify: FetchShopify,
  args: GetCollectionOptions,
  options: FetchOptions = {}
): Promise<FetchCollectionResult> {
  const {
    collectionHandle,
    collectionId,
    includeProducts = false,
    limit = 12,
    cursor,
    reverse = false,
    sortKey = "RELEVANCE",
    filters = [],
    productMetafields = [],
    collectionMetafields = [],
    variantMetafields = [],
    options: {
      resolveFiles = true,
      renderRichTextAsHtml = false,
      transformCollectionMetafields,
      transformProductMetafields,
      transformVariantMetafields,
      camelizeKeys = true,
    } = {},
  } = args;

  if (collectionHandle && collectionId) {
    console.warn(
      `[NextShopKit] ⚠️ You provided both 'collectionHandle' and 'collectionId'. Only one should be used.`
    );
  }

  const handle = collectionHandle ?? null;
  const id = collectionId ? formatGID(collectionId, "Collection") : null;

  if (!handle && !id) {
    return {
      products: [],
      pageInfo: null,
      error: "You must provide either collectionHandle or collectionId",
      collectionMetafields: {},
    };
  }

  const productMetafieldIdentifiers =
    productMetafields.length > 0
      ? buildMetafieldIdentifiers(productMetafields)
      : "";
  const variantMetafieldIdentifiers =
    variantMetafields.length > 0
      ? buildMetafieldIdentifiers(variantMetafields)
      : "";
  const collectionMetafieldIdentifiers =
    collectionMetafields.length > 0
      ? buildMetafieldIdentifiers(collectionMetafields)
      : "";

  const query = getCollectionProductsQuery(
    limit,
    productMetafieldIdentifiers,
    filters.length > 0,
    variantMetafieldIdentifiers,
    collectionMetafieldIdentifiers,
    includeProducts,
    Boolean(collectionId)
  );

  const variables = {
    ...(collectionId ? { id: collectionId } : { handle: collectionHandle }),
    cursor,
    reverse,
    sortKey,
    filters,
  };

  try {
    const json = await fetchShopify(query, variables, options);
    const collection = json.data?.collection;

    if (!collection) {
      return {
        products: [],
        pageInfo: null,
        error: "Collection not found",
        collectionMetafields: {},
      };
    }

    let resolvedCollectionMetafields: Record<string, any> = {};
    if (collection.metafields) {
      const raw = normalizeMetafields(
        collection.metafields,
        collectionMetafields
      );
      const casted = await castMetafields(
        raw,
        collectionMetafields,
        renderRichTextAsHtml,
        transformCollectionMetafields,
        resolveFiles,
        fetchShopify,
        options
      );
      resolvedCollectionMetafields = camelizeKeys
        ? camelizeMetafields(casted)
        : casted;
    }

    if (!includeProducts) {
      return {
        products: [],
        pageInfo: null,
        availableFilters: [],
        collectionMetafields: resolvedCollectionMetafields,
        error: null,
        collection: {
          id: collection.id,
          title: collection.title,
          handle: collection.handle,
          descriptionHtml: collection.descriptionHtml ?? "",
          description: collection.description ?? "",
          updatedAt: collection.updatedAt
            ? new Date(collection.updatedAt)
            : null,
          image: collection.image ?? null,
          seo: collection.seo ?? null,
        },
      };
    }

    const edges = safeParseArray(collection.products.edges);
    const products: Product[] = [];

    for (const edge of edges) {
      const node = edge.node;

      const rawProductMetafields = normalizeMetafields(
        node.metafields || [],
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
      const metafields = camelizeKeys
        ? camelizeMetafields(castedProductMetafields)
        : castedProductMetafields;

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
          const finalVariantMetafields = camelizeKeys
            ? camelizeMetafields(castedVariantMetafields)
            : castedVariantMetafields;

          return {
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

      const product: Product = {
        id: node.id,
        title: node.title,
        handle: node.handle,
        descriptionHtml: node.descriptionHtml || "",
        featuredImage: node.featuredImage || null,
        images: safeParseArray(node.images?.edges).map((edge) => edge.node),
        variants,
        price: {
          amount: variants[0]?.price?.amount,
          currencyCode: variants[0]?.price?.currencyCode,
        },
        compareAtPrice: variants[0]?.compareAtPrice
          ? {
              amount: variants[0].compareAtPrice.amount,
              currencyCode: variants[0].compareAtPrice.currencyCode,
            }
          : null,
        metafields,
      };

      products.push(product);
    }

    const pageInfo: ProductsPageInfo = collection.products.pageInfo;
    const rawFilters = collection.products.filters || [];
    const availableFilters: FilterGroup[] = formatAvailableFilters(rawFilters);

    return {
      products: products,
      pageInfo,
      availableFilters,
      collectionMetafields: resolvedCollectionMetafields,
      error: null,
      collection: {
        id: collection.id,
        title: collection.title,
        handle: collection.handle,
        descriptionHtml: collection.descriptionHtml ?? "",
        description: collection.description ?? "",
        updatedAt: collection.updatedAt ? new Date(collection.updatedAt) : null,
        image: collection.image ?? null,
        seo: collection.seo ?? null,
      },
    };
  } catch (error) {
    return {
      products: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: null,
        startCursor: null,
      },
      error: error instanceof Error ? error.message : "Unexpected error",
      collectionMetafields: {},
    };
  }
}
