import {
  FetchShopify,
  Product,
  Variant,
  VariantEdge,
  FilterGroup,
  GetSearchResultOptions,
  FetchSearchResult,
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
} from "@utils";

import { getSearchResultsQuery } from "@gql";

export async function getSearchResult(
  fetchShopify: FetchShopify,
  args: GetSearchResultOptions,
  options: FetchOptions = {}
): Promise<FetchSearchResult> {
  const {
    query,
    limit = 12,
    cursor,
    reverse = false,
    sortKey = "RELEVANCE",
    types = ["PRODUCT"],
    productFilters = [],
    prefix = "LAST",
    unavailableProducts = "LAST",
    productMetafields = [],
    variantMetafields = [],
    options: {
      resolveFiles = true,
      renderRichTextAsHtml = false,
      transformProductMetafields,
      transformVariantMetafields,
      camelizeKeys = true,
    } = {},
  } = args;

  if (!query || query.trim() === "") {
    return {
      products: [],
      pageInfo: null,
      totalCount: 0,
      searchTerm: query,
      error: "Search query cannot be empty",
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

  const graphqlQuery = getSearchResultsQuery(
    limit,
    productMetafieldIdentifiers,
    productFilters.length > 0,
    variantMetafieldIdentifiers,
    types.length > 1 || !types.includes("PRODUCT")
  );

  const variables: any = {
    query: query.trim(),
    cursor,
    reverse,
    sortKey,
    prefix,
    unavailableProducts,
  };

  if (productFilters.length > 0) {
    variables.productFilters = productFilters;
  }

  if (types.length > 1 || !types.includes("PRODUCT")) {
    variables.types = types;
  }

  try {
    const json = await fetchShopify(graphqlQuery, variables, options);
    const searchResults = json.data?.search;

    if (!searchResults) {
      return {
        products: [],
        pageInfo: null,
        totalCount: 0,
        searchTerm: query,
        error: "Search failed",
      };
    }

    const edges = safeParseArray(searchResults.nodes || []);
    const products: Product[] = [];

    for (const node of edges) {
      // Only process Product nodes, skip Articles and Pages
      if (!node.id || !node.title) continue;

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

    const pageInfo: ProductsPageInfo = searchResults.pageInfo;
    const rawFilters = searchResults.productFilters || [];
    const availableFilters: FilterGroup[] = formatAvailableFilters(rawFilters);

    return {
      products,
      pageInfo,
      availableFilters,
      totalCount: searchResults.totalCount,
      searchTerm: query,
      error: null,
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
      totalCount: 0,
      searchTerm: query,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}
