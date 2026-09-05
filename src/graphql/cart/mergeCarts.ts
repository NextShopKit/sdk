export function mergeCartsMutation(
  productMetafieldIdentifiers: string = "",
  variantMetafieldIdentifiers: string = "",
  lineLimit: number = 250
): string {
  return `
    mutation mergeCarts($sourceCartId: ID!, $destinationCartId: ID!) {
      cartMerge(sourceCartId: $sourceCartId, destinationCartId: $destinationCartId) {
        cart {
          id
          checkoutUrl
          cost {
            totalAmount { amount currencyCode }
          }
          lines(first: ${lineLimit}) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                      handle
                      metafields(identifiers: [${productMetafieldIdentifiers}]) {
                        key
                        value
                      }
                    }
                    image { url altText }
                    price { amount currencyCode }
                    metafields(identifiers: [${variantMetafieldIdentifiers}]) {
                      key
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
}
