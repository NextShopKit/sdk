"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils/resolveShopifyFiles.ts
var resolveShopifyFiles_exports = {};
__export(resolveShopifyFiles_exports, {
  resolveShopifyFiles: () => resolveShopifyFiles
});
async function resolveShopifyFiles(fileIds, fetchShopify, options) {
  const resultMap = {};
  if (fileIds.length === 0)
    return resultMap;
  try {
    const res = await fetchShopify(FILES_QUERY, { ids: fileIds }, options);
    const nodes = res.data?.nodes || [];
    for (const file of nodes) {
      if (!file?.id)
        continue;
      switch (file.__typename) {
        case "GenericFile":
          resultMap[file.id] = file;
          break;
        case "MediaImage":
          resultMap[file.id] = {
            id: file.id,
            url: file.image?.url,
            alt: file.image?.altText ?? null
          };
          break;
        case "MediaVideo":
          resultMap[file.id] = {
            id: file.id,
            videoSources: file.sources
          };
          break;
        case "ExternalVideo":
          resultMap[file.id] = {
            id: file.id,
            embedUrl: file.embedUrl,
            host: file.host
          };
          break;
      }
    }
    return resultMap;
  } catch (err) {
    console.error("Error resolving files:", err);
    return resultMap;
  }
}
var FILES_QUERY;
var init_resolveShopifyFiles = __esm({
  "src/utils/resolveShopifyFiles.ts"() {
    "use strict";
    FILES_QUERY = `
  query getFiles($ids: [ID!]!) {
  nodes(ids: $ids) {
    __typename
    ... on GenericFile {
      id
      url
      mimeType
      alt
      originalFileSize
      previewImage {
        id
        url
      }
    }
    ... on MediaImage {
      id
      image {
        url
        altText
      }
    }
  }
}

`;
  }
});

// src/index.sdk.ts
var index_sdk_exports = {};
__export(index_sdk_exports, {
  createShopifyClient: () => createShopifyClient
});
module.exports = __toCommonJS(index_sdk_exports);

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
var import_lodash_es = require("lodash-es");
function camelizeMetafields(obj) {
  if (Array.isArray(obj)) {
    return obj.map(camelizeMetafields);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        (0, import_lodash_es.camelCase)(key),
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
    const { resolveShopifyFiles: resolveShopifyFiles2 } = await Promise.resolve().then(() => (init_resolveShopifyFiles(), resolveShopifyFiles_exports));
    const fileMap = await resolveShopifyFiles2(fileGIDs, fetchShopify, options);
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
function log(...args) {
  if (isDev) {
    console.log(...args);
  }
}
function debug(...args) {
  if (isDev) {
    console.debug(...args);
  }
}
function warn(...args) {
  if (isDev) {
    console.warn(...args);
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

// src/utils/normalizeCart.ts
async function normalizeCart(rawCart, config, fetchShopify) {
  const {
    productMetafields = [],
    variantMetafields = [],
    options = {}
  } = config;
  const {
    camelizeKeys = true,
    renderRichTextAsHtml = false,
    resolveFiles = false,
    transformProductMetafields,
    transformVariantMetafields
  } = options;
  const rawLines = rawCart?.lines?.edges ?? [];
  const resolvedLines = await Promise.all(
    rawLines.map(async ({ node }) => {
      const variant = node.merchandise;
      const rawVariant = normalizeMetafields(
        variant.metafields || [],
        variantMetafields
      );
      const castedVariant = await castMetafields(
        rawVariant,
        variantMetafields,
        renderRichTextAsHtml,
        transformVariantMetafields,
        resolveFiles,
        fetchShopify
      );
      const finalVariantMetafields = camelizeKeys ? camelizeMetafields(castedVariant) : castedVariant;
      const product = variant.product;
      const rawProduct = normalizeMetafields(
        product.metafields || [],
        productMetafields
      );
      const castedProduct = await castMetafields(
        rawProduct,
        productMetafields,
        renderRichTextAsHtml,
        transformProductMetafields,
        resolveFiles,
        fetchShopify
      );
      const finalProductMetafields = camelizeKeys ? camelizeMetafields(castedProduct) : castedProduct;
      return {
        ...node,
        merchandise: {
          ...variant,
          metafields: finalVariantMetafields,
          product: {
            ...product,
            metafields: finalProductMetafields
          }
        }
      };
    })
  );
  function castAmountFields(obj) {
    if (!obj || typeof obj !== "object")
      return obj;
    const parseAmount = (amountObj) => {
      if (amountObj?.amount && typeof amountObj.amount === "string") {
        return { ...amountObj, amount: parseFloat(amountObj.amount) };
      }
      return amountObj;
    };
    return {
      ...obj,
      cost: {
        ...obj.cost,
        subtotalAmount: parseAmount(obj.cost?.subtotalAmount),
        totalAmount: parseAmount(obj.cost?.totalAmount),
        totalTaxAmount: parseAmount(obj.cost?.totalTaxAmount),
        totalDutyAmount: parseAmount(obj.cost?.totalDutyAmount)
      }
    };
  }
  return {
    ...castAmountFields(rawCart),
    lines: resolvedLines
  };
}

// src/graphql/cart/addToCart.ts
function addToCartMutation(productMetafieldIdentifiers = "", variantMetafieldIdentifiers = "", lineLimit = 250) {
  return `
    mutation addToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
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

// src/graphql/cart/applyDiscount.ts
function applyDiscountMutation(productMetafieldIdentifiers = "", variantMetafieldIdentifiers = "", lineLimit = 250) {
  return `
    mutation applyDiscount($cartId: ID!, $discountCodes: [String!]!) {
      cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
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
        userErrors {
          field
          message
        }
      }
    }
  `;
}

// src/graphql/cart/createCart.ts
var createCartMutation = `
  mutation createCart($attributes: [AttributeInput!]) {
    cartCreate(input: { attributes: $attributes }) {
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

// src/graphql/cart/getCart.ts
function getCartQuery(productMetafieldIdentifiers = "", variantMetafieldIdentifiers = "", lineLimit = 250) {
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

// src/graphql/cart/mergeCarts.ts
function mergeCartsMutation(productMetafieldIdentifiers = "", variantMetafieldIdentifiers = "", lineLimit = 250) {
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

// src/graphql/cart/removeDiscount.ts
function removeDiscountMutation(productMetafieldIdentifiers = "", variantMetafieldIdentifiers = "", lineLimit = 250) {
  return `
    mutation removeDiscount($cartId: ID!) {
      cartDiscountCodesUpdate(cartId: $cartId, discountCodes: []) {
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

// src/graphql/cart/removeFromCart.ts
function removeFromCartMutation(productMetafieldIdentifiers = "", variantMetafieldIdentifiers = "", lineLimit = 250) {
  return `
    mutation removeFromCart($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
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
function updateCartAttributesMutation(productMetafieldIdentifiers = "", variantMetafieldIdentifiers = "", lineLimit = 250) {
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

// src/graphql/cart/updateCartItem.ts
function updateCartItemMutation(productMetafieldIdentifiers = "", variantMetafieldIdentifiers = "", lineLimit = 250) {
  return `
    mutation updateCartItem($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
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

// src/graphql/products/getProductByHandle.ts
var getProductByHandleQuery = (fields, variantFields, productMetafieldIdentifiers, variantMetafieldIdentifiers) => {
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

// src/graphql/products/getProductById.ts
var getProductByIdQuery = (fields, variantFields, productMetafieldIdentifiers, variantMetafieldIdentifiers) => {
  const productFieldLines = fields.map((field) => field);
  const variantFieldLines = variantFields.map((field) => field);
  return `
  query getProductById($id: ID!) {
    node(id: $id) {
      ... on Product {
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
  }
`;
};

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
        ` : ""}
      }
    }
  `;
}

// src/graphql/search/getSearchResults.ts
function getSearchResultsQuery(limit, productMetafieldIdentifiers, hasFilters, variantMetafieldIdentifiers, hasTypes) {
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

// src/actions/products/getProduct.ts
async function getProduct(fetchShopify, args, options) {
  const {
    handle,
    id,
    fields,
    variantFields,
    customMetafields = [],
    variantMetafields = [],
    options: settings
  } = args;
  const defaultFields = [
    "id",
    "title",
    "handle",
    "descriptionHtml"
  ];
  const defaultVariantFields = ["id", "title"];
  const uniqueFields = Array.from(
    /* @__PURE__ */ new Set([...defaultFields, ...fields ?? []])
  );
  const uniqueVariantFields = Array.from(
    /* @__PURE__ */ new Set([...defaultVariantFields, ...variantFields ?? []])
  );
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
    uniqueFields,
    uniqueVariantFields,
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  ) : getProductByHandleQuery(
    uniqueFields,
    uniqueVariantFields,
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
    const productData = {};
    for (const field of uniqueFields) {
      if (field in node) {
        productData[field] = node[field];
      }
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
        const variantTyped = variant;
        const variantData = {};
        for (const field of uniqueVariantFields) {
          if (field in variantTyped) {
            variantData[field] = variantTyped[field];
          }
        }
        return {
          ...variantData,
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
      ...productData,
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
      products: [],
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
        products: [],
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
        products: [],
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
      products,
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
      products: [],
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
async function createCart(fetchShopify, config) {
  const attributes = config?.customAttributes ?? [];
  const response = await fetchShopify(createCartMutation, {
    attributes
  });
  const cart = response?.data?.cartCreate?.cart;
  return safeExtract("createCart", cart, {
    config,
    attributes,
    response
  });
}

// src/actions/cart/actions/getCart.ts
async function getCart(fetchShopify, cartId, config = {}) {
  const { productMetafields = [], variantMetafields = [] } = config;
  const productMetafieldIdentifiers = productMetafields.length ? buildMetafieldIdentifiers(productMetafields) : "";
  const variantMetafieldIdentifiers = variantMetafields.length ? buildMetafieldIdentifiers(variantMetafields) : "";
  const query = getCartQuery(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );
  const response = await fetchShopify(query, { cartId });
  const normalizedCart = await normalizeCart(
    response?.data?.cart,
    config,
    fetchShopify
  );
  return safeExtract("normalizeCart", normalizedCart, {
    cartId,
    config,
    response
  });
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
async function addToCart(fetchShopify, cartId, lines, config = {}) {
  const { productMetafields = [], variantMetafields = [] } = config;
  const productMetafieldIdentifiers = productMetafields.length ? buildMetafieldIdentifiers(productMetafields) : "";
  const variantMetafieldIdentifiers = variantMetafields.length ? buildMetafieldIdentifiers(variantMetafields) : "";
  const mutation = addToCartMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );
  const response = await fetchShopify(mutation, { cartId, lines });
  const rawCart = response?.data?.cartLinesAdd?.cart;
  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);
  return safeExtract("addToCart", normalizedCart, {
    cartId,
    lines,
    config,
    response
  });
}

// src/actions/cart/mutations/removeFromCart.ts
async function removeFromCart(fetchShopify, cartId, lineId, config = {}) {
  const { productMetafields = [], variantMetafields = [] } = config;
  const productMetafieldIdentifiers = productMetafields.length ? buildMetafieldIdentifiers(productMetafields) : "";
  const variantMetafieldIdentifiers = variantMetafields.length ? buildMetafieldIdentifiers(variantMetafields) : "";
  const mutation = removeFromCartMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );
  const removeResponse = await fetchShopify(mutation, {
    cartId,
    lineIds: [lineId]
  });
  const rawCart = removeResponse?.data?.cartLinesRemove?.cart;
  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);
  return safeExtract("removeFromCart", normalizedCart, {
    cartId,
    lineId,
    config,
    removeResponse
  });
}

// src/actions/cart/mutations/updateCartItem.ts
async function updateCartItem(fetchShopify, cartId, lineId, quantity, config = {}) {
  const { productMetafields = [], variantMetafields = [] } = config;
  const productMetafieldIdentifiers = productMetafields.length ? buildMetafieldIdentifiers(productMetafields) : "";
  const variantMetafieldIdentifiers = variantMetafields.length ? buildMetafieldIdentifiers(variantMetafields) : "";
  const mutation = updateCartItemMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );
  const response = await fetchShopify(mutation, {
    cartId,
    lines: [{ id: lineId, quantity }]
  });
  const rawCart = response?.data?.cartLinesUpdate?.cart;
  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);
  return safeExtract("updateCartItem", normalizedCart, {
    cartId,
    lineId,
    quantity,
    config,
    response
  });
}

// src/actions/cart/mutations/applyDiscount.ts
async function applyDiscount(fetchShopify, cartId, code, config = {}) {
  const { productMetafields = [], variantMetafields = [] } = config;
  const productMetafieldIdentifiers = productMetafields.length ? buildMetafieldIdentifiers(productMetafields) : "";
  const variantMetafieldIdentifiers = variantMetafields.length ? buildMetafieldIdentifiers(variantMetafields) : "";
  const mutation = applyDiscountMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );
  const result = await fetchShopify(mutation, {
    cartId,
    discountCodes: [code]
  });
  const discountResult = result?.data?.cartDiscountCodesUpdate;
  if (discountResult?.userErrors?.length) {
    warn("[applyDiscount] User errors:", discountResult.userErrors);
  }
  const rawCart = discountResult?.cart;
  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);
  return safeExtract("applyDiscount", normalizedCart, {
    cartId,
    code,
    config,
    result
  });
}

// src/actions/cart/mutations/removeDiscount.ts
async function removeDiscount(fetchShopify, cartId, config = {}) {
  const { productMetafields = [], variantMetafields = [] } = config;
  const productMetafieldIdentifiers = productMetafields.length ? buildMetafieldIdentifiers(productMetafields) : "";
  const variantMetafieldIdentifiers = variantMetafields.length ? buildMetafieldIdentifiers(variantMetafields) : "";
  const mutation = removeDiscountMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );
  const response = await fetchShopify(mutation, { cartId });
  const rawCart = response?.data?.cartDiscountCodesUpdate?.cart;
  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);
  return safeExtract("removeDiscount", normalizedCart, {
    cartId,
    config,
    response
  });
}

// src/actions/cart/mutations/emptyCart.ts
async function emptyCart(fetchShopify, cartId, config = {}) {
  const { productMetafields = [], variantMetafields = [] } = config;
  const productMetafieldIdentifiers = productMetafields.length ? buildMetafieldIdentifiers(productMetafields) : "";
  const variantMetafieldIdentifiers = variantMetafields.length ? buildMetafieldIdentifiers(variantMetafields) : "";
  const query = getCartQuery(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );
  const cartResponse = await fetchShopify(query, { cartId });
  const rawCart = safeExtract("emptyCart (fetch)", cartResponse?.data?.cart, {
    cartId,
    cartResponse
  });
  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);
  const lineIds = normalizedCart.lines.map((line) => line.id);
  if (lineIds.length === 0) {
    log("[emptyCart] Cart already empty", { cartId });
    return normalizedCart;
  }
  const mutation = removeFromCartMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );
  const removeResponse = await fetchShopify(mutation, {
    cartId,
    lineIds
  });
  const removedRawCart = removeResponse?.data?.cartLinesRemove?.cart;
  const normalizedRemovedCart = await normalizeCart(
    removedRawCart,
    config,
    fetchShopify
  );
  return safeExtract("emptyCart (remove)", normalizedRemovedCart, {
    cartId,
    lineIds,
    removeResponse
  });
}

// src/actions/cart/mutations/mergeCarts.ts
async function mergeCarts(fetchShopify, sourceCartId, destinationCartId, config = {}) {
  const { productMetafields = [], variantMetafields = [] } = config;
  const productMetafieldIdentifiers = productMetafields.length ? buildMetafieldIdentifiers(productMetafields) : "";
  const variantMetafieldIdentifiers = variantMetafields.length ? buildMetafieldIdentifiers(variantMetafields) : "";
  const mutation = mergeCartsMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );
  const response = await fetchShopify(mutation, {
    sourceCartId,
    destinationCartId
  });
  const rawCart = response?.data?.cartMerge?.cart;
  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);
  return safeExtract("mergeCarts", normalizedCart, {
    sourceCartId,
    destinationCartId,
    config,
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
async function updateCartAttributes(fetchShopify, cartId, attributes, config = {}) {
  const { productMetafields = [], variantMetafields = [] } = config;
  const productMetafieldIdentifiers = productMetafields.length ? buildMetafieldIdentifiers(productMetafields) : "";
  const variantMetafieldIdentifiers = variantMetafields.length ? buildMetafieldIdentifiers(variantMetafields) : "";
  const mutation = updateCartAttributesMutation(
    productMetafieldIdentifiers,
    variantMetafieldIdentifiers
  );
  const response = await fetchShopify(mutation, {
    cartId,
    attributes
  });
  const rawCart = response?.data?.cartAttributesUpdate?.cart;
  const normalizedCart = await normalizeCart(rawCart, config, fetchShopify);
  return safeExtract("updateCartAttributes", normalizedCart, {
    cartId,
    attributes,
    config,
    response
  });
}

// src/actions/search/getSearchResult.ts
async function getSearchResult(fetchShopify, args, options = {}) {
  const {
    query,
    limit = 12,
    cursor,
    reverse = false,
    sortKey = "RELEVANCE",
    types = ["PRODUCT"],
    productFilters = [],
    prefix = "LAST",
    unavailableProducts = "LAST",
    productMetafields = [],
    variantMetafields = [],
    options: {
      resolveFiles = true,
      renderRichTextAsHtml = false,
      transformProductMetafields,
      transformVariantMetafields,
      camelizeKeys = true
    } = {}
  } = args;
  if (!query || query.trim() === "") {
    return {
      products: [],
      pageInfo: null,
      totalCount: 0,
      searchTerm: query,
      error: "Search query cannot be empty"
    };
  }
  const productMetafieldIdentifiers = productMetafields.length > 0 ? buildMetafieldIdentifiers(productMetafields) : "";
  const variantMetafieldIdentifiers = variantMetafields.length > 0 ? buildMetafieldIdentifiers(variantMetafields) : "";
  const graphqlQuery = getSearchResultsQuery(
    limit,
    productMetafieldIdentifiers,
    productFilters.length > 0,
    variantMetafieldIdentifiers,
    types.length > 1 || !types.includes("PRODUCT")
  );
  const variables = {
    query: query.trim(),
    cursor,
    reverse,
    sortKey,
    prefix,
    unavailableProducts
  };
  if (productFilters.length > 0) {
    variables.productFilters = productFilters;
  }
  if (types.length > 1 || !types.includes("PRODUCT")) {
    variables.types = types;
  }
  try {
    const json = await fetchShopify(graphqlQuery, variables, options);
    const searchResults = json.data?.search;
    if (!searchResults) {
      return {
        products: [],
        pageInfo: null,
        totalCount: 0,
        searchTerm: query,
        error: "Search failed"
      };
    }
    const edges = safeParseArray(searchResults.nodes || []);
    const products = [];
    for (const node of edges) {
      if (!node.id || !node.title)
        continue;
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
        images: safeParseArray(node.images?.edges).map((edge) => edge.node),
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
    const pageInfo = searchResults.pageInfo;
    const rawFilters = searchResults.productFilters || [];
    const availableFilters = formatAvailableFilters(rawFilters);
    return {
      products,
      pageInfo,
      availableFilters,
      totalCount: searchResults.totalCount,
      searchTerm: query,
      error: null
    };
  } catch (error2) {
    return {
      products: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: null,
        startCursor: null
      },
      totalCount: 0,
      searchTerm: query,
      error: error2 instanceof Error ? error2.message : "Unexpected error"
    };
  }
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
    getSearchResult: (args) => getSearchResult(shared.fetchShopify, args),
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createShopifyClient
});
//# sourceMappingURL=index.sdk.js.map