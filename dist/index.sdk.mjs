import {
  __export
} from "./chunk-E2SEJZTC.mjs";

// src/clients/createSharedShopify.ts
function createSharedShopify(config) {
  const apiVersion = config.apiVersion || "2025-01";
  const endpoint = `https://${config.shop}/api/${apiVersion}/graphql.json`;
  const memoryCache = /* @__PURE__ */ new Map();
  function generateKey(query, variables) {
    return JSON.stringify({ query, variables });
  }
  async function fetchShopify(query, variables = {}, options = {}) {
    const {
      useMemoryCache = config.enableMemoryCache,
      useVercelCache = config.enableVercelCache,
      cacheTtl = config.defaultCacheTtl ?? 60,
      revalidate = config.defaultRevalidate ?? 60
    } = options;
    const key = generateKey(query, variables);
    const now = Date.now();
    if (useMemoryCache && memoryCache.has(key)) {
      const { timestamp, data } = memoryCache.get(key);
      if (now - timestamp < cacheTtl * 1e3) {
        return data;
      }
    }
    const headers = {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": config.token
    };
    if (useVercelCache && typeof window === "undefined") {
      headers["Cache-Control"] = `s-maxage=${revalidate}, stale-while-revalidate=30`;
    }
    const fetchOptions = {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables })
    };
    const res = await fetch(endpoint, fetchOptions);
    const json = await res.json();
    if (json.errors) {
      throw new Error(json.errors[0]?.message || "Shopify GraphQL error");
    }
    if (useMemoryCache) {
      memoryCache.set(key, { timestamp: now, data: json });
    }
    return json;
  }
  return {
    fetchShopify,
    clearCache: () => memoryCache.clear(),
    getCache: () => memoryCache
  };
}

// src/utils/buildMetafieldIdentifiers.ts
function buildMetafieldIdentifiers(metafields) {
  return metafields.map(({ field }) => {
    const [namespace, key] = field.split(".");
    return `{ namespace: "${namespace}", key: "${key}" }`;
  }).join(",\n");
}

// src/utils/camelizeKeys.ts
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

// src/utils/castMetafields.ts
async function castMetafields(normalizedMetafields, definitions, renderRichTextAsHtml, transformMetafields, resolveFiles = false, fetchShopify, options = {}) {
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
    const { resolveShopifyFiles } = await import("./resolveShopifyFiles-CD5F6S72.mjs");
    const fileMap = await resolveShopifyFiles(fileGIDs, fetchShopify, options);
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

// src/utils/castMetafieldValue.ts
function castSingleValue(value, type) {
  switch (type) {
    case "integer":
    case "decimal":
    case "money":
    case "rating":
    case "weight":
    case "volume":
    case "dimension":
      return Number(value);
    case "true_false":
      return value === "true";
    case "json":
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    case "date":
    case "date_and_time":
      return new Date(value);
    case "Product":
    case "Product_variant":
    case "Customer":
    case "Company":
    case "Page":
    case "Collection":
    case "File":
    case "Metaobject":
      return value;
    default:
      return value;
  }
}
function castMetafieldValue(rawValue, type) {
  const parsed = tryParseArrayOrReturnOriginal(rawValue);
  if (Array.isArray(parsed)) {
    return parsed.map(
      (item) => typeof item === "string" ? castSingleValue(item, type) : item
    );
  }
  return castSingleValue(parsed, type);
}

// src/utils/formatAvailableFilters.ts
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

// src/utils/normalizeMetafields.ts
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
    const key = field.key.includes(".") ? field.key.split(".").pop() : field.key;
    const namespace = keyToNamespace.get(key) || "global";
    if (!result[namespace]) {
      result[namespace] = {};
    }
    result[namespace][key] = field.value;
  }
  return result;
}

// src/utils/renderRichText.ts
function renderRichText(schema, options = {}) {
  let { scoped, classes, newLineToBreak } = options;
  let html = "";
  if (typeof schema === "string") {
    try {
      schema = JSON.parse(schema);
    } catch (error2) {
      console.error("Error parsing rich text schema:", error2);
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

// src/utils/safeParseArray.ts
function safeParseArray(value) {
  return Array.isArray(value) ? value : [];
}

// src/utils/tryParseArrayOrReturnOriginal.ts
function tryParseArrayOrReturnOriginal(value) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed))
      return parsed;
    return value;
  } catch {
    return value;
  }
}

// src/utils/formatGID.ts
function formatGID(id, resource) {
  if (!id || !resource)
    throw new Error("Both id and resource are required.");
  return `gid://shopify/${resource}/${id}`;
}

// src/utils/log.ts
var isDev = process.env.NODE_ENV === "development";
function debug(...args) {
  if (isDev) {
    console.debug(...args);
  }
}
function error(...args) {
  if (isDev) {
    console.error(...args);
  }
}

// src/utils/safeExtract.ts
function safeExtract(label, value, context) {
  if (!value) {
    error(`[${label}] Response missing or invalid`, context);
    if (process.env.NODE_ENV === "development") {
      throw new Error(`[${label}] Missing or undefined value`);
    }
  }
  if (process.env.NODE_ENV === "development") {
    debug(`[${label}] Success`, value);
  }
  return value;
}

// src/graphql/cart/addToCart.ts
var addToCartMutation = `
  mutation addToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount { amount currencyCode }
        }
        lines(first: 10) {
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
                    metafields(identifiers: [
                      { namespace: "custom", key: "category" },
                    ]) {
                      key
                      value
                    }
                  }
                  image { url altText }
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// src/graphql/cart/applyDiscount.ts
var applyDiscountMutation = `
  mutation applyDiscount($cartId: ID!, $discountCodes: [String!]!) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount { amount currencyCode }
        }
      }
    }
  }
`;

// src/graphql/cart/createCart.ts
var createCartMutation = `
  mutation {
    cartCreate {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount { amount currencyCode }
        }
        lines(first: 10) {
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
                  }
                  image { url altText }
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// src/graphql/cart/getCart.ts
var getCartQuery = `
  query getCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      cost {
        totalAmount { amount currencyCode }
      }
      lines(first: 10) {
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
                  metafields(identifiers: [
                    { namespace: "custom", key: "category" },
                  ]) {
                    key
                    value
                  }
                }
                image { url altText }
                price { amount currencyCode }
              }
            }
          }
        }
      }
    }
  }
`;

// src/graphql/cart/mergeCarts.ts
var mergeCartsMutation = `
  mutation mergeCarts($sourceCartId: ID!, $destinationCartId: ID!) {
    cartMerge(sourceCartId: $sourceCartId, destinationCartId: $destinationCartId) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount { amount currencyCode }
        }
        lines(first: 50) {
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
                  }
                  image { url altText }
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// src/graphql/cart/removeDiscount.ts
var removeDiscountMutation = `
  mutation removeDiscount($cartId: ID!) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: []) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount { amount currencyCode }
        }
      }
    }
  }
`;

// src/graphql/cart/removeFromCart.ts
var removeFromCartMutation = `
  mutation removeFromCart($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount { amount currencyCode }
        }
        lines(first: 50) {
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
                    metafields(identifiers: [
                      { namespace: "custom", key: "category" },
                    ]) {
                      key
                      value
                    }
                  }
                  image { url altText }
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// src/graphql/cart/updateBuyerIdentity.ts
var updateBuyerIdentityMutation = `
  mutation updateBuyerIdentity($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        id
        buyerIdentity {
          email
          phone
          countryCode
          customerAccessToken
        }
      }
    }
  }
`;

// src/graphql/cart/updateCartAttributes.ts
var updateCartAttributesMutation = `
  mutation updateCartAttributes($cartId: ID!, $attributes: [AttributeInput!]!) {
    cartAttributesUpdate(cartId: $cartId, attributes: $attributes) {
      cart {
        id
        attributes {
          key
          value
        }
      }
    }
  }
`;

// src/graphql/cart/updateCartItem.ts
var updateCartItemMutation = `
  mutation updateCartItem($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount { amount currencyCode }
        }
        lines(first: 50) {
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
                    metafields(identifiers: [
                      { namespace: "custom", key: "category" },
                    ]) {
                      key
                      value
                    }
                  }
                  image { url altText }
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// src/graphql/products/getProductByHandle.ts
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

// src/graphql/products/getProductById.ts
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

// src/graphql/collections/getCollectionProducts.ts
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

// src/actions/products/getProduct.ts
async function getProduct(fetchShopify, args, options) {
  const {
    handle,
    id,
    customMetafields = [],
    variantMetafields = [],
    options: settings
  } = args;
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
    const json = await fetchShopify(query, variables, options);
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
      fetchShopify,
      options
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
          fetchShopify,
          options
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

// src/actions/collections/getCollection.ts
async function getCollection(fetchShopify, args, options = {}) {
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
  } = args;
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
    const json = await fetchShopify(query, variables, options);
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
      const raw = normalizeMetafields(
        collection.metafields,
        collectionMetafields
      );
      const casted = await castMetafields(
        raw,
        collectionMetafields,
        renderRichTextAsHtml,
        transformCollectionMetafields,
        resolveFiles,
        fetchShopify,
        options
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
        fetchShopify,
        options
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
            fetchShopify,
            options
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
  } catch (error2) {
    return {
      data: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: null,
        startCursor: null
      },
      error: error2 instanceof Error ? error2.message : "Unexpected error",
      collectionMetafields: {}
    };
  }
}

// src/actions/cart/actions/index.ts
var actions_exports = {};
__export(actions_exports, {
  createCart: () => createCart,
  getCart: () => getCart
});

// src/actions/cart/actions/createCart.ts
async function createCart(fetchShopify) {
  const data = await fetchShopify(createCartMutation);
  return data.cartCreate.cart;
}

// src/actions/cart/actions/getCart.ts
async function getCart(fetchShopify, cartId) {
  const response = await fetchShopify(getCartQuery, { cartId });
  return response.data.cart;
}

// src/actions/cart/mutations/index.ts
var mutations_exports = {};
__export(mutations_exports, {
  addToCart: () => addToCart,
  applyDiscount: () => applyDiscount,
  emptyCart: () => emptyCart,
  mergeCarts: () => mergeCarts,
  removeDiscount: () => removeDiscount,
  removeFromCart: () => removeFromCart,
  updateBuyerIdentity: () => updateBuyerIdentity,
  updateCartAttributes: () => updateCartAttributes,
  updateCartItem: () => updateCartItem
});

// src/actions/cart/mutations/addToCart.ts
async function addToCart(fetchShopify, cartId, lines) {
  const response = await fetchShopify(addToCartMutation, {
    cartId,
    lines: lines.map((line) => ({
      merchandiseId: line.variantId,
      quantity: line.quantity
    }))
  });
  return safeExtract("addToCart", response?.data?.cartLinesAdd?.cart, {
    cartId,
    lines,
    response
  });
}

// src/actions/cart/mutations/removeFromCart.ts
async function removeFromCart(fetchShopify, cartId, lineId) {
  const result = await fetchShopify(removeFromCartMutation, {
    cartId,
    lineIds: [lineId]
  });
  return safeExtract("removeFromCart", result?.data?.cartLinesRemove?.cart, {
    cartId,
    lineId,
    result
  });
}

// src/actions/cart/mutations/updateCartItem.ts
async function updateCartItem(fetchShopify, cartId, lineId, quantity) {
  const result = await fetchShopify(updateCartItemMutation, {
    cartId,
    lines: [{ id: lineId, quantity }]
  });
  const updateResult = result.data?.cartLinesUpdate;
  if (!updateResult || !updateResult.cart) {
    error("[updateCartItem] Invalid response:", result);
    throw new Error("Failed to update cart item: cart data missing");
  }
  return updateResult.cart;
}

// src/actions/cart/mutations/applyDiscount.ts
async function applyDiscount(fetchShopify, cartId, code) {
  const result = await fetchShopify(applyDiscountMutation, {
    cartId,
    discountCodes: [code]
  });
  const discountResult = result?.data?.cartDiscountCodesUpdate;
  if (discountResult?.userErrors?.length) {
    console.warn("[applyDiscount] User errors:", discountResult.userErrors);
  }
  return safeExtract("applyDiscount", discountResult?.cart, {
    cartId,
    code,
    result
  });
}

// src/actions/cart/mutations/removeDiscount.ts
async function removeDiscount(fetchShopify, cartId) {
  const response = await fetchShopify(removeDiscountMutation, { cartId });
  return safeExtract(
    "removeDiscount",
    response?.data?.cartDiscountCodesUpdate?.cart,
    {
      cartId,
      response
    }
  );
}

// src/actions/cart/mutations/emptyCart.ts
async function emptyCart(fetchShopify, cartId) {
  const cartResponse = await fetchShopify(getCartQuery, { cartId });
  const cart = safeExtract("emptyCart (fetch)", cartResponse?.data?.cart, {
    cartId,
    cartResponse
  });
  const lines = Array.isArray(cart.lines) ? cart.lines : cart.lines?.edges?.map((edge) => edge.node) || [];
  const lineIds = lines.map((line) => line.id);
  if (lineIds.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[emptyCart] Cart already empty");
    }
    return cart;
  }
  const removeResponse = await fetchShopify(removeFromCartMutation, {
    cartId,
    lineIds
  });
  return safeExtract(
    "emptyCart (remove)",
    removeResponse?.data?.cartLinesRemove?.cart,
    {
      cartId,
      lineIds,
      removeResponse
    }
  );
}

// src/actions/cart/mutations/mergeCarts.ts
async function mergeCarts(fetchShopify, sourceCartId, destinationCartId) {
  const response = await fetchShopify(mergeCartsMutation, {
    sourceCartId,
    destinationCartId
  });
  return safeExtract("mergeCarts", response?.data?.cartMerge?.cart, {
    sourceCartId,
    destinationCartId,
    response
  });
}

// src/actions/cart/mutations/updateBuyerIdentity.ts
async function updateBuyerIdentity(fetchShopify, cartId, buyerIdentity) {
  const response = await fetchShopify(updateBuyerIdentityMutation, {
    cartId,
    buyerIdentity
  });
  return safeExtract(
    "updateBuyerIdentity",
    response?.data?.cartBuyerIdentityUpdate?.cart,
    {
      cartId,
      buyerIdentity,
      response
    }
  );
}

// src/actions/cart/mutations/updateCartAttributes.ts
async function updateCartAttributes(fetchShopify, cartId, attributes) {
  const response = await fetchShopify(updateCartAttributesMutation, {
    cartId,
    attributes
  });
  return safeExtract(
    "updateCartAttributes",
    response?.data?.cartAttributesUpdate?.cart,
    {
      cartId,
      attributes,
      response
    }
  );
}

// src/clients/createBaseClient.ts
function createBaseClient(config) {
  const shared = createSharedShopify(config);
  return {
    fetchShopify: shared.fetchShopify,
    clearCache: shared.clearCache,
    getCache: shared.getCache,
    // core
    getProduct: (args) => getProduct(shared.fetchShopify, args),
    getCollection: (args) => getCollection(shared.fetchShopify, args),
    // cart
    createCart: () => actions_exports.createCart(shared.fetchShopify),
    getCart: (cartId) => actions_exports.getCart(shared.fetchShopify, cartId),
    addToCart: (cartId, lines) => mutations_exports.addToCart(shared.fetchShopify, cartId, lines),
    removeFromCart: (cartId, lineId) => mutations_exports.removeFromCart(shared.fetchShopify, cartId, lineId),
    updateCartItem: (cartId, lineId, quantity) => mutations_exports.updateCartItem(
      shared.fetchShopify,
      cartId,
      lineId,
      quantity
    ),
    emptyCart: (cartId) => mutations_exports.emptyCart(shared.fetchShopify, cartId),
    applyDiscount: (cartId, code) => mutations_exports.applyDiscount(shared.fetchShopify, cartId, code),
    removeDiscount: (cartId) => mutations_exports.removeDiscount(shared.fetchShopify, cartId),
    updateCartAttributes: (cartId, attributes) => mutations_exports.updateCartAttributes(
      shared.fetchShopify,
      cartId,
      attributes
    ),
    updateBuyerIdentity: (cartId, buyerIdentity) => mutations_exports.updateBuyerIdentity(
      shared.fetchShopify,
      cartId,
      buyerIdentity
    ),
    mergeCarts: (sourceCartId, destinationCartId) => mutations_exports.mergeCarts(
      shared.fetchShopify,
      sourceCartId,
      destinationCartId
    )
  };
}

// src/clients/createShopifyClient.ts
function createShopifyClient(config) {
  return createBaseClient(config);
}
export {
  createShopifyClient
};
//# sourceMappingURL=index.sdk.mjs.map