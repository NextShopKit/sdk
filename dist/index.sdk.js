"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

var _chunkSSYGV25Pjs = require('./chunk-SSYGV25P.js');

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
      cacheTtl = _nullishCoalesce(config.defaultCacheTtl, () => ( 60)),
      revalidate = _nullishCoalesce(config.defaultRevalidate, () => ( 60))
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
    if (useVercelCache) {
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
      throw new Error(_optionalChain([json, 'access', _ => _.errors, 'access', _2 => _2[0], 'optionalAccess', _3 => _3.message]) || "Shopify GraphQL error");
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
var _lodashes = require('lodash-es');
function camelizeMetafields(obj) {
  if (Array.isArray(obj)) {
    return obj.map(camelizeMetafields);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        _lodashes.camelCase.call(void 0, key),
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
    const rawValue = _optionalChain([normalizedMetafields, 'optionalAccess', _4 => _4[namespace], 'optionalAccess', _5 => _5[key]]);
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
    const { resolveShopifyFiles } = await Promise.resolve().then(() => _interopRequireWildcard(require("./resolveShopifyFiles-AKSIZYWS.js")));
    const fileMap = await resolveShopifyFiles(fileGIDs, fetchShopify, options);
    for (const def of definitions) {
      if (def.type !== "File")
        continue;
      const [namespace, key] = def.field.split(".");
      const raw = _optionalChain([result, 'access', _6 => _6[namespace], 'optionalAccess', _7 => _7[key]]);
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
      } catch (e2) {
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
      return parseStringifiedArray(value);
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
    if (!_optionalChain([field, 'optionalAccess', _8 => _8.key]))
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

// src/utils/parseStringifiedArray.ts
function parseStringifiedArray(value) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (typeof parsed === "string") {
      return [parsed];
    } else {
      return [value];
    }
  } catch (e3) {
    return [value];
  }
}

// src/utils/renderRichText.ts
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
  return createElement("p", classes, renderRichText(_optionalChain([el, 'optionalAccess', _9 => _9.children]), options));
}
function buildHeading(el, options) {
  const { classes } = options;
  const tag = `h${_optionalChain([el, 'optionalAccess', _10 => _10.level]) || 1}`;
  return createElement(tag, classes, renderRichText(_optionalChain([el, 'optionalAccess', _11 => _11.children]), options));
}
function buildList(el, options) {
  const { classes } = options;
  const tag = _optionalChain([el, 'optionalAccess', _12 => _12.listType]) === "ordered" ? "ol" : "ul";
  return createElement(tag, classes, renderRichText(_optionalChain([el, 'optionalAccess', _13 => _13.children]), options));
}
function buildListItem(el, options) {
  const { classes } = options;
  return createElement("li", classes, renderRichText(_optionalChain([el, 'optionalAccess', _14 => _14.children]), options));
}
function buildLink(el, options) {
  const { classes } = options;
  const attributes = {
    href: _optionalChain([el, 'optionalAccess', _15 => _15.url]),
    title: _optionalChain([el, 'optionalAccess', _16 => _16.title]),
    target: _optionalChain([el, 'optionalAccess', _17 => _17.target])
  };
  return createElement(
    "a",
    classes,
    renderRichText(_optionalChain([el, 'optionalAccess', _18 => _18.children]), options),
    attributes
  );
}
function buildText(el, options) {
  const { classes, newLineToBreak } = options;
  if (_optionalChain([el, 'optionalAccess', _19 => _19.bold]) && _optionalChain([el, 'optionalAccess', _20 => _20.italic])) {
    return createElement(
      "strong",
      classes,
      createElement("em", classes, _optionalChain([el, 'optionalAccess', _21 => _21.value]))
    );
  } else if (_optionalChain([el, 'optionalAccess', _22 => _22.bold])) {
    return createElement("strong", classes, _optionalChain([el, 'optionalAccess', _23 => _23.value]));
  } else if (_optionalChain([el, 'optionalAccess', _24 => _24.italic])) {
    return createElement("em", classes, _optionalChain([el, 'optionalAccess', _25 => _25.value]));
  } else {
    return newLineToBreak ? _optionalChain([el, 'optionalAccess', _26 => _26.value, 'optionalAccess', _27 => _27.replace, 'call', _28 => _28(/\n/g, "<br>")]) || "" : _optionalChain([el, 'optionalAccess', _29 => _29.value]) || "";
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
  } catch (e4) {
  }
  return value;
}

// src/utils/formatGID.ts
function formatGID(id, resource) {
  if (!id || !resource)
    throw new Error("Both id and resource are required.");
  return `gid://shopify/${resource}/${id}`;
}

// src/graphql/cart/addMultipleLines.ts
var addMultipleLinesMutation = `
  mutation addMultipleLines($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount {
            amount
            currencyCode
          }
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
    if (_optionalChain([json, 'access', _30 => _30.errors, 'optionalAccess', _31 => _31.length])) {
      return {
        data: null,
        error: _optionalChain([json, 'access', _32 => _32.errors, 'access', _33 => _33[0], 'optionalAccess', _34 => _34.message]) || "GraphQL error"
      };
    }
    const node = id ? _optionalChain([json, 'access', _35 => _35.data, 'optionalAccess', _36 => _36.node]) : _optionalChain([json, 'access', _37 => _37.data, 'optionalAccess', _38 => _38.productByHandle]);
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
    const images = safeParseArray(_optionalChain([node, 'access', _39 => _39.images, 'optionalAccess', _40 => _40.edges])).map(
      (edge) => ({
        originalSrc: edge.node.originalSrc,
        altText: _nullishCoalesce(edge.node.altText, () => ( null))
      })
    );
    const variants = await Promise.all(
      safeParseArray(_optionalChain([node, 'access', _41 => _41.variants, 'optionalAccess', _42 => _42.edges])).map(async (edge) => {
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
          productTitle: _optionalChain([variant, 'access', _43 => _43.product, 'optionalAccess', _44 => _44.title]) || node.title,
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
    const defaultPrice = _nullishCoalesce(_optionalChain([variants, 'access', _45 => _45[0], 'optionalAccess', _46 => _46.price]), () => ( {
      amount: 0,
      currencyCode: "EUR"
    }));
    const defaultCompareAtPrice = _nullishCoalesce(_optionalChain([variants, 'access', _47 => _47[0], 'optionalAccess', _48 => _48.compareAtPrice]), () => ( null));
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
  const handle = _nullishCoalesce(collectionHandle, () => ( null));
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
    const collection = _optionalChain([json, 'access', _49 => _49.data, 'optionalAccess', _50 => _50.collection]);
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
          descriptionHtml: _nullishCoalesce(collection.descriptionHtml, () => ( "")),
          description: _nullishCoalesce(collection.description, () => ( "")),
          updatedAt: collection.updatedAt ? new Date(collection.updatedAt) : null,
          image: _nullishCoalesce(collection.image, () => ( null)),
          seo: _nullishCoalesce(collection.seo, () => ( null))
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
        safeParseArray(_optionalChain([node, 'access', _51 => _51.variants, 'optionalAccess', _52 => _52.edges])).map(async (edge2) => {
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
            productTitle: _optionalChain([variant, 'access', _53 => _53.product, 'optionalAccess', _54 => _54.title]) || node.title,
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
        images: safeParseArray(_optionalChain([node, 'access', _55 => _55.images, 'optionalAccess', _56 => _56.edges])).map((edge2) => edge2.node),
        variants,
        price: {
          amount: _optionalChain([variants, 'access', _57 => _57[0], 'optionalAccess', _58 => _58.price, 'optionalAccess', _59 => _59.amount]),
          currencyCode: _optionalChain([variants, 'access', _60 => _60[0], 'optionalAccess', _61 => _61.price, 'optionalAccess', _62 => _62.currencyCode])
        },
        compareAtPrice: _optionalChain([variants, 'access', _63 => _63[0], 'optionalAccess', _64 => _64.compareAtPrice]) ? {
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
        descriptionHtml: _nullishCoalesce(collection.descriptionHtml, () => ( "")),
        description: _nullishCoalesce(collection.description, () => ( "")),
        updatedAt: collection.updatedAt ? new Date(collection.updatedAt) : null,
        image: _nullishCoalesce(collection.image, () => ( null)),
        seo: _nullishCoalesce(collection.seo, () => ( null))
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

// src/actions/cart/actions/index.ts
var actions_exports = {};
_chunkSSYGV25Pjs.__export.call(void 0, actions_exports, {
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
  const data = await fetchShopify(getCartQuery, { cartId });
  return data.cart;
}

// src/actions/cart/mutations/index.ts
var mutations_exports = {};
_chunkSSYGV25Pjs.__export.call(void 0, mutations_exports, {
  addMultipleLines: () => addMultipleLines,
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
  const data = await fetchShopify(addToCartMutation, {
    cartId,
    lines: lines.map((line) => ({
      merchandiseId: line.variantId,
      quantity: line.quantity
    }))
  });
  return data.cartLinesAdd.cart;
}

// src/actions/cart/mutations/addMultipleLines.ts
async function addMultipleLines(fetchShopify, cartId, lines) {
  const variables = {
    cartId,
    lines: lines.map((line) => ({
      merchandiseId: line.variantId,
      quantity: line.quantity
    }))
  };
  const data = await fetchShopify(addMultipleLinesMutation, variables);
  return data.cartLinesAdd.cart;
}

// src/actions/cart/mutations/removeFromCart.ts
async function removeFromCart(fetchShopify, cartId, lineId) {
  const data = await fetchShopify(removeFromCartMutation, {
    cartId,
    lineIds: [lineId]
  });
  return data.cartLinesRemove.cart;
}

// src/actions/cart/mutations/updateCartItem.ts
async function updateCartItem(fetchShopify, cartId, lineId, quantity) {
  const data = await fetchShopify(updateCartItemMutation, {
    cartId,
    lines: [{ id: lineId, quantity }]
  });
  return data.cartLinesUpdate.cart;
}

// src/actions/cart/mutations/applyDiscount.ts
async function applyDiscount(fetchShopify, cartId, code) {
  const data = await fetchShopify(applyDiscountMutation, {
    cartId,
    discountCodes: [code]
  });
  return data.cartDiscountCodesUpdate.cart;
}

// src/actions/cart/mutations/removeDiscount.ts
async function removeDiscount(fetchShopify, cartId) {
  const data = await fetchShopify(removeDiscountMutation, { cartId });
  return data.cartDiscountCodesUpdate.cart;
}

// src/actions/cart/mutations/emptyCart.ts
async function emptyCart(fetchShopify, cartId) {
  const getCartData = await fetchShopify(getCartQuery, { cartId });
  const cart = getCartData.cart;
  const flatLines = Array.isArray(cart.lines) ? cart.lines : (_optionalChain([cart, 'access', _65 => _65.lines, 'optionalAccess', _66 => _66.edges]) || []).map((edge) => edge.node);
  const lineIds = flatLines.map((line) => line.id);
  if (lineIds.length === 0)
    return cart;
  const removeData = await fetchShopify(removeFromCartMutation, {
    cartId,
    lineIds
  });
  return removeData.cartLinesRemove.cart;
}

// src/actions/cart/mutations/mergeCarts.ts
async function mergeCarts(fetchShopify, sourceCartId, destinationCartId) {
  const data = await fetchShopify(mergeCartsMutation, {
    sourceCartId,
    destinationCartId
  });
  return data.cartMerge.cart;
}

// src/actions/cart/mutations/updateBuyerIdentity.ts
async function updateBuyerIdentity(fetchShopify, cartId, buyerIdentity) {
  const data = await fetchShopify(updateBuyerIdentityMutation, {
    cartId,
    buyerIdentity
  });
  return data.cartBuyerIdentityUpdate.cart;
}

// src/actions/cart/mutations/updateCartAttributes.ts
async function updateCartAttributes(fetchShopify, cartId, attributes) {
  const data = await fetchShopify(updateCartAttributesMutation, {
    cartId,
    attributes
  });
  return data.cartAttributesUpdate.cart;
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
    addMultipleLines: (cartId, lines) => mutations_exports.addMultipleLines(shared.fetchShopify, cartId, lines),
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

// src/components/CartProvider.tsx
var _react = require('react');
var _jsxruntime = require('react/jsx-runtime');
var CartContext = _react.createContext.call(void 0, 
  void 0
);
function CartProvider({
  children,
  client
}) {
  const [cart, setCart] = _react.useState.call(void 0, null);
  const [loading, setLoading] = _react.useState.call(void 0, true);
  const [totalCount, setTotalCount] = _react.useState.call(void 0, 0);
  const [totalPrice, setTotalPrice] = _react.useState.call(void 0, 0);
  _react.useEffect.call(void 0, () => {
    const init = async () => {
      const storedCartId = localStorage.getItem("shopify_cart_id");
      try {
        let initialCart;
        if (storedCartId) {
          initialCart = await client.getCart(storedCartId);
        } else {
          initialCart = await client.createCart();
          localStorage.setItem("shopify_cart_id", initialCart.id);
        }
        updateCartState(initialCart);
      } catch (err) {
        console.error("Cart init error", err);
      }
      setLoading(false);
    };
    init();
    window.addEventListener("storage", (e) => {
      if (e.key === "shopify_cart_id")
        init();
    });
  }, [client]);
  const updateCartState = (cart2) => {
    setCart(cart2);
    const total = cart2.lines.reduce(
      (sum, line) => sum + (line.quantity || 0),
      0
    );
    const price = parseFloat(cart2.cost.totalAmount.amount || "0");
    setTotalCount(total);
    setTotalPrice(price);
  };
  const addProducts = async (lines) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.addToCart(cart.id, lines);
    updateCartState(updated);
    setLoading(false);
  };
  const addMultipleProducts = async (lines) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.addMultipleLines(cart.id, lines);
    updateCartState(updated);
    setLoading(false);
  };
  const removeProduct = async (lineId) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.removeFromCart(cart.id, lineId);
    updateCartState(updated);
    setLoading(false);
  };
  const updateQuantity = async (lineId, quantity) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.updateCartItem(cart.id, lineId, quantity);
    updateCartState(updated);
    setLoading(false);
  };
  const applyDiscountCode = async (code) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.applyDiscount(cart.id, code);
    updateCartState(updated);
    setLoading(false);
  };
  const removeDiscountCode = async () => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.removeDiscount(cart.id);
    updateCartState(updated);
    setLoading(false);
  };
  const emptyCart2 = async () => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.emptyCart(cart.id);
    updateCartState(updated);
    setLoading(false);
  };
  const mergeCarts2 = async (sourceCartId) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.mergeCarts(sourceCartId, cart.id);
    updateCartState(updated);
    setLoading(false);
  };
  const updateBuyerIdentity2 = async (buyerIdentity) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.updateBuyerIdentity(cart.id, buyerIdentity);
    updateCartState(updated);
    setLoading(false);
  };
  const updateCartAttributes2 = async (attributes) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.updateCartAttributes(cart.id, attributes);
    updateCartState(updated);
    setLoading(false);
  };
  const resetCart = async () => {
    setLoading(true);
    const newCart = await client.createCart();
    localStorage.setItem("shopify_cart_id", newCart.id);
    updateCartState(newCart);
    setLoading(false);
  };
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    CartContext.Provider,
    {
      value: {
        cart,
        loading,
        addProducts,
        addMultipleProducts,
        removeProduct,
        updateQuantity,
        applyDiscountCode,
        removeDiscountCode,
        emptyCart: emptyCart2,
        mergeCarts: mergeCarts2,
        updateBuyerIdentity: updateBuyerIdentity2,
        updateCartAttributes: updateCartAttributes2,
        resetCart,
        totalCount,
        totalPrice
      },
      children
    }
  );
}

// src/hooks/useCart.ts

function useCart() {
  const context = _react.useContext.call(void 0, CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}




exports.CartProvider = CartProvider; exports.createShopifyClient = createShopifyClient; exports.useCart = useCart;
//# sourceMappingURL=index.sdk.js.map