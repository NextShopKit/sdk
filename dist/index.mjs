// src/shared/createClient.ts
function createSharedShopify(config) {
  const apiVersion = config.apiVersion || "2025-01";
  const endpoint = `https://${config.shop}/api/${apiVersion}/graphql.json`;
  async function fetchShopify(query, variables = {}) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": config.token
      },
      body: JSON.stringify({ query, variables })
    });
    const json = await res.json();
    if (json.errors) {
      throw new Error(json.errors[0]?.message || "Shopify GraphQL error");
    }
    return json;
  }
  return {
    fetchShopify
  };
}

// src/shared/utils/buildMetafieldIdentifiers.ts
function buildMetafieldIdentifiers(metafields) {
  return metafields.map(({ field }) => {
    const [namespace, key] = field.split(".");
    return `{ namespace: "${namespace}", key: "${key}" }`;
  }).join(",\n");
}

// src/shared/utils/camelizeKeys.ts
import { camelCase } from "lodash-es";
function camelizeMetafields(obj) {
  if (Array.isArray(obj)) {
    return obj.map(camelizeMetafields);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        camelCase(key),
        camelizeMetafields(value)
      ])
    );
  }
  return obj;
}

// src/shared/utils/parseStringifiedArray.ts
function parseStringifiedArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : value;
  } catch {
    return value;
  }
}

// src/shared/utils/castMetafieldValue.ts
function castMetafieldValue(rawValue, type) {
  switch (type) {
    case "integer":
    case "decimal":
    case "money":
    case "rating":
    case "weight":
    case "volume":
    case "dimension":
      return Number(rawValue);
    case "true_false":
      return rawValue === "true";
    case "json":
      try {
        return JSON.parse(rawValue);
      } catch {
        return rawValue;
      }
    case "date":
    case "date_and_time":
      return new Date(rawValue);
    case "color":
    case "url":
    case "id":
    case "single_line_text":
    case "multi_line_text":
    case "rich_text":
      return rawValue;
    case "Product":
    case "Product_variant":
    case "Customer":
    case "Company":
    case "Page":
    case "Collection":
    case "File":
    case "Metaobject":
      return parseStringifiedArray(rawValue);
    default:
      return rawValue;
  }
}

// src/shared/utils/renderRichText.ts
function renderRichText(schema, options = {}) {
  let { scoped, classes, newLineToBreak } = options;
  let html = "";
  if (typeof schema === "string") {
    try {
      schema = JSON.parse(schema);
    } catch (error) {
      console.error("Error parsing rich text schema:", error);
      return schema;
    }
  }
  if (typeof options === "string" || typeof options === "boolean") {
    scoped = options;
  }
  if (schema && schema.type === "root" && Array.isArray(schema.children) && schema.children.length > 0) {
    if (scoped) {
      const className = scoped === true ? "rte" : scoped;
      html += `<div class="${className}">${renderRichText(
        schema.children,
        options
      )}</div>`;
    } else {
      html += renderRichText(schema.children, options);
    }
  } else if (Array.isArray(schema)) {
    for (const el of schema) {
      switch (el.type) {
        case "paragraph":
          html += buildParagraph(el, options);
          break;
        case "heading":
          html += buildHeading(el, options);
          break;
        case "list":
          html += buildList(el, options);
          break;
        case "list-item":
          html += buildListItem(el, options);
          break;
        case "link":
          html += buildLink(el, options);
          break;
        case "text":
          html += buildText(el, options);
          break;
        default:
          break;
      }
    }
  }
  return html;
}
function getClass(tag, classes) {
  if (classes && classes[tag]) {
    return classes[tag];
  }
  return null;
}
function outputAttributes(attributes) {
  if (!attributes)
    return "";
  return Object.keys(attributes).filter((key) => attributes[key]).map((key) => ` ${key}="${attributes[key]}"`).join("");
}
function createElement(tag, classes, content, attributes = {}) {
  const className = getClass(tag, classes);
  if (className) {
    attributes = { ...attributes, class: className };
  }
  return `<${tag}${outputAttributes(attributes)}>${content}</${tag}>`;
}
function buildParagraph(el, options) {
  const { classes } = options;
  return createElement("p", classes, renderRichText(el?.children, options));
}
function buildHeading(el, options) {
  const { classes } = options;
  const tag = `h${el?.level || 1}`;
  return createElement(tag, classes, renderRichText(el?.children, options));
}
function buildList(el, options) {
  const { classes } = options;
  const tag = el?.listType === "ordered" ? "ol" : "ul";
  return createElement(tag, classes, renderRichText(el?.children, options));
}
function buildListItem(el, options) {
  const { classes } = options;
  return createElement("li", classes, renderRichText(el?.children, options));
}
function buildLink(el, options) {
  const { classes } = options;
  const attributes = {
    href: el?.url,
    title: el?.title,
    target: el?.target
  };
  return createElement(
    "a",
    classes,
    renderRichText(el?.children, options),
    attributes
  );
}
function buildText(el, options) {
  const { classes, newLineToBreak } = options;
  if (el?.bold && el?.italic) {
    return createElement(
      "strong",
      classes,
      createElement("em", classes, el?.value)
    );
  } else if (el?.bold) {
    return createElement("strong", classes, el?.value);
  } else if (el?.italic) {
    return createElement("em", classes, el?.value);
  } else {
    return newLineToBreak ? el?.value?.replace(/\n/g, "<br>") || "" : el?.value || "";
  }
}

// src/shared/utils/castMetafields.ts
async function castMetafields(normalizedMetafields, definitions, renderRichTextAsHtml, transformMetafields, resolveFiles = false, fetchShopify) {
  const result = {};
  const resolvedDefs = [];
  const fileGIDs = [];
  for (const def of definitions) {
    const [namespace, key] = def.field.split(".");
    const rawValue = normalizedMetafields?.[namespace]?.[key];
    resolvedDefs.push({
      namespace,
      key,
      fullKey: def.field,
      type: def.type
    });
    if (rawValue === void 0)
      continue;
    result[namespace] = result[namespace] || {};
    if (def.type === "rich_text" && renderRichTextAsHtml) {
      result[namespace][key] = renderRichText(rawValue);
      continue;
    }
    if (def.type === "File" && resolveFiles) {
      const casted = castMetafieldValue(rawValue, def.type);
      if (Array.isArray(casted)) {
        fileGIDs.push(...casted);
      } else if (typeof casted === "string") {
        fileGIDs.push(casted);
      }
      result[namespace][key] = casted;
      continue;
    }
    result[namespace][key] = castMetafieldValue(rawValue, def.type);
  }
  if (resolveFiles && fileGIDs.length > 0 && fetchShopify) {
    const { resolveShopifyFiles } = await import("./resolveShopifyFiles-KCFRCQE7.mjs");
    const fileMap = await resolveShopifyFiles(fileGIDs, fetchShopify);
    for (const def of definitions) {
      if (def.type !== "File")
        continue;
      const [namespace, key] = def.field.split(".");
      const raw = result[namespace]?.[key];
      if (Array.isArray(raw)) {
        result[namespace][key] = raw.map((gid) => fileMap[gid] || gid);
      } else if (typeof raw === "string") {
        result[namespace][key] = fileMap[raw] || raw;
      }
    }
  }
  if (typeof transformMetafields === "function") {
    return transformMetafields(normalizedMetafields, result, resolvedDefs);
  }
  return result;
}

// src/shared/utils/safeParseArray.ts
function safeParseArray(value) {
  return Array.isArray(value) ? value : [];
}

// src/shared/utils/formatAvailableFilters.ts
function formatAvailableFilters(rawFilters) {
  return rawFilters.map((group) => ({
    id: group.id,
    label: group.label,
    values: safeParseArray(group.values).map((value) => ({
      id: value.id,
      label: value.label,
      count: value.count
    }))
  }));
}

// src/shared/utils/normalizeMetafields.ts
function normalizeMetafields(metafields, definitions) {
  const result = {};
  const keyToNamespace = /* @__PURE__ */ new Map();
  for (const def of definitions) {
    const [namespace, key] = def.field.split(".");
    keyToNamespace.set(key, namespace);
  }
  for (const field of metafields) {
    if (!field?.key)
      continue;
    const key = field.key;
    const namespace = keyToNamespace.get(key) || "global";
    if (!result[namespace]) {
      result[namespace] = {};
    }
    result[namespace][key] = field.value;
  }
  return result;
}

// src/shared/graphql/getProductById.ts
var getProductByIdQuery = (productMetafieldIdentifiers, variantMetafieldIdentifiers) => `
  query getProductById($id: ID!) {
    node(id: $id) {
      ... on Product {
        id
        title
        handle
        descriptionHtml
        featuredImage {
          originalSrc
          altText
        }
        images(first: 10) {
          edges {
            node {
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
              priceV2 { amount, currencyCode }
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
  }
`;

// src/shared/graphql/getProductByHandle.ts
var getProductByHandleQuery = (productMetafieldIdentifiers, variantMetafieldIdentifiers) => `
  query getProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      descriptionHtml
      featuredImage {
        originalSrc
        altText
      }
      images(first: 10) {
        edges {
          node {
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
            priceV2 { amount, currencyCode }
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

// src/core/getProduct.ts
async function getProduct(fetchShopify, options) {
  const {
    handle,
    id,
    customMetafields = [],
    variantMetafields = [],
    options: settings
  } = options;
  const {
    locale,
    renderRichTextAsHtml = false,
    camelizeKeys = true,
    resolveFiles = true,
    transformMetafields,
    transformVariantMetafields
  } = settings;
  if (!handle && !id) {
    return { data: null, error: "Either handle or id must be provided" };
  }
  const productMetafieldIdentifiers = customMetafields.length > 0 ? buildMetafieldIdentifiers(customMetafields) : "";
  const variantMetafieldIdentifiers = variantMetafields.length > 0 ? buildMetafieldIdentifiers(variantMetafields) : "";
  const query = id ? getProductByIdQuery(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  ) : getProductByHandleQuery(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );
  const variables = id ? { id } : { handle, locale };
  try {
    const json = await fetchShopify(query, variables);
    if (json.errors?.length) {
      return {
        data: null,
        error: json.errors[0]?.message || "GraphQL error"
      };
    }
    const node = id ? json.data?.node : json.data?.productByHandle;
    if (!node) {
      return { data: null, error: "Product not found" };
    }
    const rawMetafields = normalizeMetafields(
      node.metafields || [],
      customMetafields
    );
    const castedMetafields = customMetafields.length > 0 ? await castMetafields(
      rawMetafields,
      customMetafields,
      renderRichTextAsHtml,
      transformMetafields,
      resolveFiles,
      fetchShopify
    ) : rawMetafields;
    const metafields = camelizeKeys !== false ? camelizeMetafields(castedMetafields) : castedMetafields;
    const images = safeParseArray(node.images?.edges).map(
      (edge) => ({
        originalSrc: edge.node.originalSrc,
        altText: edge.node.altText ?? null
      })
    );
    const variants = await Promise.all(
      safeParseArray(node.variants?.edges).map(async (edge) => {
        const variant = edge.node;
        const rawVariantMetafields = normalizeMetafields(
          variant.metafields || [],
          variantMetafields
        );
        const castedVariantMetafields = variantMetafields.length > 0 ? await castMetafields(
          rawVariantMetafields,
          variantMetafields,
          renderRichTextAsHtml,
          transformVariantMetafields,
          resolveFiles,
          fetchShopify
        ) : rawVariantMetafields;
        const finalVariantMetafields = camelizeKeys !== false ? camelizeMetafields(castedVariantMetafields) : castedVariantMetafields;
        return {
          id: variant.id,
          productTitle: variant.product?.title || node.title,
          variantTitle: variant.title === "Default Title" ? node.title : variant.title,
          price: {
            amount: parseFloat(variant.priceV2.amount),
            currencyCode: variant.priceV2.currencyCode
          },
          compareAtPrice: variant.compareAtPriceV2 ? {
            amount: parseFloat(variant.compareAtPriceV2.amount),
            currencyCode: variant.compareAtPriceV2.currencyCode
          } : null,
          metafields: finalVariantMetafields
        };
      })
    );
    const defaultPrice = variants[0]?.price ?? {
      amount: 0,
      currencyCode: "EUR"
    };
    const defaultCompareAtPrice = variants[0]?.compareAtPrice ?? null;
    const product = {
      id: node.id,
      title: node.title,
      handle: node.handle,
      descriptionHtml: node.descriptionHtml || "",
      featuredImage: node.featuredImage || null,
      images,
      variants,
      price: defaultPrice,
      compareAtPrice: defaultCompareAtPrice,
      metafields
    };
    return { data: product, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unexpected error"
    };
  }
}

// src/shared/graphql/getCollectionProducts.ts
function getCollectionProductsQuery(limit, productMetafieldIdentifiers, hasFilters, variantMetafieldIdentifiers, collectionMetafieldIdentifiers, includeProducts, useId) {
  const collectionSelector = useId ? "collection(id: $id)" : "collection(handle: $handle)";
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
        ${includeProducts ? `
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
                originalSrc
                altText
              }
              images(first: 10) {
                edges {
                  node {
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
                    priceV2 { amount currencyCode }
                    compareAtPriceV2 { amount currencyCode }
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
        ` : ""}
      }
    }
  `;
}

// src/shared/utils/formatGID.ts
function formatGID(id, resource) {
  if (!id || !resource)
    throw new Error("Both id and resource are required.");
  return `gid://shopify/${resource}/${id}`;
}

// src/core/getCollection.ts
async function getCollection(fetchShopify, config) {
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
      camelizeKeys = true
    } = {}
  } = config;
  if (collectionHandle && collectionId) {
    console.warn(
      `[NextShopKit] \u26A0\uFE0F You provided both 'collectionHandle' and 'collectionId'. Only one should be used.`
    );
  }
  const handle = collectionHandle ?? null;
  const id = collectionId ? formatGID(collectionId, "Collection") : null;
  if (!handle && !id) {
    return {
      data: [],
      pageInfo: null,
      error: "You must provide either collectionHandle or collectionId",
      collectionMetafields: {}
    };
  }
  const productMetafieldIdentifiers = productMetafields.length > 0 ? buildMetafieldIdentifiers(productMetafields) : "";
  const variantMetafieldIdentifiers = variantMetafields.length > 0 ? buildMetafieldIdentifiers(variantMetafields) : "";
  const collectionMetafieldIdentifiers = collectionMetafields.length > 0 ? buildMetafieldIdentifiers(collectionMetafields) : "";
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
    ...collectionId ? { id: collectionId } : { handle: collectionHandle },
    cursor,
    reverse,
    sortKey,
    filters
  };
  try {
    const json = await fetchShopify(query, variables);
    const collection = json.data?.collection;
    if (!collection) {
      return {
        data: [],
        pageInfo: null,
        error: "Collection not found",
        collectionMetafields: {}
      };
    }
    let resolvedCollectionMetafields = {};
    if (collection.metafields) {
      const raw = normalizeMetafields(collection.metafields, collectionMetafields);
      const casted = await castMetafields(
        raw,
        collectionMetafields,
        renderRichTextAsHtml,
        transformCollectionMetafields,
        resolveFiles,
        fetchShopify
      );
      resolvedCollectionMetafields = camelizeKeys ? camelizeMetafields(casted) : casted;
    }
    if (!includeProducts) {
      return {
        data: [],
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
          updatedAt: collection.updatedAt ? new Date(collection.updatedAt) : null,
          image: collection.image ?? null,
          seo: collection.seo ?? null
        }
      };
    }
    const edges = safeParseArray(collection.products.edges);
    const products = [];
    for (const edge of edges) {
      const node = edge.node;
      const rawProductMetafields = normalizeMetafields(
        node.metafields || [],
        productMetafields
      );
      const castedProductMetafields = productMetafields.length > 0 ? await castMetafields(
        rawProductMetafields,
        productMetafields,
        renderRichTextAsHtml,
        transformProductMetafields,
        resolveFiles,
        fetchShopify
      ) : rawProductMetafields;
      const metafields = camelizeKeys ? camelizeMetafields(castedProductMetafields) : castedProductMetafields;
      const variants = await Promise.all(
        safeParseArray(node.variants?.edges).map(async (edge2) => {
          const variant = edge2.node;
          const rawVariantMetafields = normalizeMetafields(
            variant.metafields || [],
            variantMetafields
          );
          const castedVariantMetafields = variantMetafields.length > 0 ? await castMetafields(
            rawVariantMetafields,
            variantMetafields,
            renderRichTextAsHtml,
            transformVariantMetafields,
            resolveFiles,
            fetchShopify
          ) : rawVariantMetafields;
          const finalVariantMetafields = camelizeKeys ? camelizeMetafields(castedVariantMetafields) : castedVariantMetafields;
          return {
            id: variant.id,
            productTitle: variant.product?.title || node.title,
            variantTitle: variant.title === "Default Title" ? node.title : variant.title,
            price: {
              amount: parseFloat(variant.priceV2.amount),
              currencyCode: variant.priceV2.currencyCode
            },
            compareAtPrice: variant.compareAtPriceV2 ? {
              amount: parseFloat(variant.compareAtPriceV2.amount),
              currencyCode: variant.compareAtPriceV2.currencyCode
            } : null,
            metafields: finalVariantMetafields
          };
        })
      );
      const product = {
        id: node.id,
        title: node.title,
        handle: node.handle,
        descriptionHtml: node.descriptionHtml || "",
        featuredImage: node.featuredImage || null,
        images: safeParseArray(node.images?.edges).map((edge2) => edge2.node),
        variants,
        price: {
          amount: variants[0]?.price?.amount,
          currencyCode: variants[0]?.price?.currencyCode
        },
        compareAtPrice: variants[0]?.compareAtPrice ? {
          amount: variants[0].compareAtPrice.amount,
          currencyCode: variants[0].compareAtPrice.currencyCode
        } : null,
        metafields
      };
      products.push(product);
    }
    const pageInfo = collection.products.pageInfo;
    const rawFilters = collection.products.filters || [];
    const availableFilters = formatAvailableFilters(rawFilters);
    return {
      data: products,
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
        seo: collection.seo ?? null
      }
    };
  } catch (error) {
    return {
      data: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: null,
        startCursor: null
      },
      error: error instanceof Error ? error.message : "Unexpected error",
      collectionMetafields: {}
    };
  }
}

// src/core/createBaseClient.ts
function createShopifyClient(config) {
  const { fetchShopify } = createSharedShopify(config);
  return {
    fetchShopify,
    getProduct: (args) => getProduct(fetchShopify, args),
    getCollection: (args) => getCollection(fetchShopify, args)
  };
}
export {
  createShopifyClient
};
//# sourceMappingURL=index.mjs.map