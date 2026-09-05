export function getSearchResultsQuery(
  limit: number,
  productMetafieldIdentifiers: string,
  hasFilters: boolean,
  variantMetafieldIdentifiers: string,
  hasTypes: boolean
): string {
  return `
    query getSearchResults(
      $query: String!
      $cursor: String
      ${hasFilters ? ", $productFilters: [ProductFilter!]" : ""}
      $sortKey: SearchSortKeys
      $reverse: Boolean
      $prefix: SearchPrefixQueryType
      $unavailableProducts: SearchUnavailableProductsType
      ${hasTypes ? ", $types: [SearchType!]" : ""}
    ) {
      search(
        query: $query
        first: ${limit}
        after: $cursor
        sortKey: $sortKey
        reverse: $reverse
        prefix: $prefix
        unavailableProducts: $unavailableProducts
        ${hasFilters ? "productFilters: $productFilters" : ""}
        ${hasTypes ? "types: $types" : ""}
      ) {
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        productFilters {
          id
          label
          values {
            id
            label
            count
          }
        }
        nodes {
          ... on Product {
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
    }
  `;
}
