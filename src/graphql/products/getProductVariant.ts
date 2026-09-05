export function getProductVariantQuery({
  includeProduct,
  variantMetafieldIdentifiers,
  productMetafieldIdentifiers,
  fields = [],
  productFields = [],
}: {
  includeProduct: boolean;
  variantMetafieldIdentifiers: string;
  productMetafieldIdentifiers: string;
  fields?: string[];
  productFields?: string[];
}): string {
  const variantFieldLines = fields.map((field) => field);
  const productFieldLines = productFields.map((field) => field);

  return `
    query getProductVariant($id: ID!) {
      node(id: $id) {
        __typename
        ... on ProductVariant {
          price { amount, currencyCode }
          priceV2 { amount, currencyCode }
          compareAtPrice { amount, currencyCode }
          compareAtPriceV2 { amount, currencyCode }
          image {
            url
            altText
            width
            height
            id
          }
          ${variantFieldLines.join("\n")}
          ${
            variantMetafieldIdentifiers
              ? `metafields(identifiers: [${variantMetafieldIdentifiers}]) { key value }`
              : ""
          }
          ${
            includeProduct
              ? `
            product {
              ${productFieldLines.join("\n")}
              images(first: 50) {
                edges {
                  node {
                    url
                    originalSrc
                    altText
                  }
                }
              }
              variants(first: 50) {
                edges {
                  node {
                    price { amount, currencyCode }
                    priceV2 { amount, currencyCode }
                    compareAtPrice { amount, currencyCode }
                    compareAtPriceV2 { amount, currencyCode }
                    product { title, handle }
                    image {
                      url
                      altText
                      width
                      height
                      id
                    }
                    ${variantFieldLines.join("\n")}
                    ${
                      variantMetafieldIdentifiers
                        ? `metafields(identifiers: [${variantMetafieldIdentifiers}]) { key value }`
                        : ""
                    }
                  }
                }
              }
              ${
                productMetafieldIdentifiers
                  ? `metafields(identifiers: [${productMetafieldIdentifiers}]) { key value }`
                  : ""
              }
            }
          `
              : ""
          }
        }
      }
    }
  `;
}
