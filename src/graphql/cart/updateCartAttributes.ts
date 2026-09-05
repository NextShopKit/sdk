export function updateCartAttributesMutation(
  productMetafieldIdentifiers: string = "",
  variantMetafieldIdentifiers: string = "",
  lineLimit: number = 250
): string {
  return `
    mutation updateCartAttributes($cartId: ID!, $attributes: [AttributeInput!]!) {
      cartAttributesUpdate(cartId: $cartId, attributes: $attributes) {
        cart {
          id
          checkoutUrl
          cost {
            totalAmount { amount currencyCode }
          }
          attributes {
            key
            value
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
