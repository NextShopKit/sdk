export function getCartQuery(
  productMetafieldIdentifiers: string = "",
  variantMetafieldIdentifiers: string = "",
  lineLimit: number = 250 // default to max
) {
  return `
    query getCart($cartId: ID!) {
      cart(id: $cartId) {
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
  `;
}
