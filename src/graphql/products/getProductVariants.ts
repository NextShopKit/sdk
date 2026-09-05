export function getProductVariantsQuery({
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
  const variantFieldLines = fields.length > 0 ? fields.join("\n") : "id";
  const productFieldLines =
    productFields.length > 0 ? productFields.join("\n") : "id";

  return `
    query getProductVariants($ids: [ID!]!) {
      nodes(ids: $ids) {
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
          ${variantFieldLines}
          ${
            variantMetafieldIdentifiers
              ? `metafields(identifiers: [${variantMetafieldIdentifiers}]) { key value }`
              : ""
          }
          ${
            includeProduct
              ? `
            product {
              ${productFieldLines}
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
                    id
                    title
                    price { amount, currencyCode }
                    priceV2 { amount, currencyCode }
                    compareAtPrice { amount, currencyCode }
                    compareAtPriceV2 { amount, currencyCode }
                    product { id title handle }
                    image {
                      url
                      altText
                      width
                      height
                      id
                    }
                    ${variantFieldLines}
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
