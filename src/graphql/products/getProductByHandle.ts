import { ProductFields, VariantFields } from "index.pro";

export const getProductByHandleQuery = (
  fields: ProductFields,
  variantFields: VariantFields,
  productMetafieldIdentifiers: string,
  variantMetafieldIdentifiers: string
) => {
  const productFieldLines = fields.map((field) => field);
  const variantFieldLines = variantFields.map((field) => field);
  return `
  query getProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      ${productFieldLines.join("\n")}  
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
            ${variantFieldLines.join("\n")}
            price { amount, currencyCode }
            priceV2 { amount, currencyCode }
            compareAtPrice { amount, currencyCode }
            compareAtPriceV2 { amount, currencyCode }
            product { title, handle }
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
`;
};
