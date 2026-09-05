export function getCollectionProductsQuery(
  limit: number,
  productMetafieldIdentifiers: string,
  hasFilters: boolean,
  variantMetafieldIdentifiers: string,
  collectionMetafieldIdentifiers: string,
  includeProducts: boolean,
  useId: boolean // ✅ new param
): string {
  const collectionSelector = useId
    ? "collection(id: $id)"
    : "collection(handle: $handle)";

  return `
    query getCollectionProducts(
      ${useId ? "$id: ID!" : "$handle: String!"}
      ${includeProducts ? ", $cursor: String" : ""}
      ${includeProducts && hasFilters ? ", $filters: [ProductFilter!]" : ""}
      ${includeProducts ? ", $sortKey: ProductCollectionSortKeys" : ""}
      ${includeProducts ? ", $reverse: Boolean" : ""}
    ) {
      ${collectionSelector} {
        id
        title
        handle
        description
        descriptionHtml
        updatedAt
        image {
          id
          url
          originalSrc
          width
          height
          altText
        }
        seo {
          title
          description
        }
        metafields(identifiers: [${collectionMetafieldIdentifiers}]) {
          namespace
          key
          value
          type
        }
        ${
          includeProducts
            ? `
        products(
          first: ${limit},
          after: $cursor,
          sortKey: $sortKey,
          reverse: $reverse
          ${hasFilters ? "filters: $filters," : ""}
        ) {
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          filters {
            id
            label
            values {
              id
              label
              count
            }
          }
          edges {
            node {
              id
              title
              handle
              descriptionHtml
              featuredImage {
                url
                originalSrc
                altText
              }
              images(first: 10) {
                edges {
                  node {
                    url
                    originalSrc
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price { 
                      amount 
                      currencyCode 
                    }
                    priceV2 { 
                      amount 
                      currencyCode 
                    }
                    compareAtPrice { 
                      amount 
                      currencyCode 
                    }
                    compareAtPriceV2 { 
                      amount 
                      currencyCode 
                    }
                    product { title handle }
                    metafields(identifiers: [${variantMetafieldIdentifiers}]) {
                      key
                      value
                    }
                  }
                }
              }
              metafields(identifiers: [${productMetafieldIdentifiers}]) {
                key
                value
              }
            }
          }
        }
        `
            : ""
        }
      }
    }
  `;
}
