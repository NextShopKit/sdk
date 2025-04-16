"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/shared/createClient.ts
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

// src/shared/utils/buildMetafieldIdentifiers.ts
function buildMetafieldIdentifiers(metafields) {
  return metafields.map(({ field }) => {
    const [namespace, key] = field.split(".");
    return `{ namespace: "${namespace}", key: "${key}" }`;
  }).join(",\n");
}

// src/shared/utils/camelizeKeys.ts
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

// src/shared/utils/parseStringifiedArray.ts
function parseStringifiedArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : value;
  } catch (e) {
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
      } catch (e2) {
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
  return createElement("p", classes, renderRichText(_optionalChain([el, 'optionalAccess', _4 => _4.children]), options));
}
function buildHeading(el, options) {
  const { classes } = options;
  const tag = `h${_optionalChain([el, 'optionalAccess', _5 => _5.level]) || 1}`;
  return createElement(tag, classes, renderRichText(_optionalChain([el, 'optionalAccess', _6 => _6.children]), options));
}
function buildList(el, options) {
  const { classes } = options;
  const tag = _optionalChain([el, 'optionalAccess', _7 => _7.listType]) === "ordered" ? "ol" : "ul";
  return createElement(tag, classes, renderRichText(_optionalChain([el, 'optionalAccess', _8 => _8.children]), options));
}
function buildListItem(el, options) {
  const { classes } = options;
  return createElement("li", classes, renderRichText(_optionalChain([el, 'optionalAccess', _9 => _9.children]), options));
}
function buildLink(el, options) {
  const { classes } = options;
  const attributes = {
    href: _optionalChain([el, 'optionalAccess', _10 => _10.url]),
    title: _optionalChain([el, 'optionalAccess', _11 => _11.title]),
    target: _optionalChain([el, 'optionalAccess', _12 => _12.target])
  };
  return createElement(
    "a",
    classes,
    renderRichText(_optionalChain([el, 'optionalAccess', _13 => _13.children]), options),
    attributes
  );
}
function buildText(el, options) {
  const { classes, newLineToBreak } = options;
  if (_optionalChain([el, 'optionalAccess', _14 => _14.bold]) && _optionalChain([el, 'optionalAccess', _15 => _15.italic])) {
    return createElement(
      "strong",
      classes,
      createElement("em", classes, _optionalChain([el, 'optionalAccess', _16 => _16.value]))
    );
  } else if (_optionalChain([el, 'optionalAccess', _17 => _17.bold])) {
    return createElement("strong", classes, _optionalChain([el, 'optionalAccess', _18 => _18.value]));
  } else if (_optionalChain([el, 'optionalAccess', _19 => _19.italic])) {
    return createElement("em", classes, _optionalChain([el, 'optionalAccess', _20 => _20.value]));
  } else {
    return newLineToBreak ? _optionalChain([el, 'optionalAccess', _21 => _21.value, 'optionalAccess', _22 => _22.replace, 'call', _23 => _23(/\n/g, "<br>")]) || "" : _optionalChain([el, 'optionalAccess', _24 => _24.value]) || "";
  }
}

// src/shared/utils/castMetafields.ts
async function castMetafields(normalizedMetafields, definitions, renderRichTextAsHtml, transformMetafields, resolveFiles = false, fetchShopify, options = {}) {
  const result = {};
  const resolvedDefs = [];
  const fileGIDs = [];
  for (const def of definitions) {
    const [namespace, key] = def.field.split(".");
    const rawValue = _optionalChain([normalizedMetafields, 'optionalAccess', _25 => _25[namespace], 'optionalAccess', _26 => _26[key]]);
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
    const { resolveShopifyFiles } = await Promise.resolve().then(() => _interopRequireWildcard(require("./resolveShopifyFiles-IKFEOYVH.js")));
    const fileMap = await resolveShopifyFiles(fileGIDs, fetchShopify, options);
    for (const def of definitions) {
      if (def.type !== "File")
        continue;
      const [namespace, key] = def.field.split(".");
      const raw = _optionalChain([result, 'access', _27 => _27[namespace], 'optionalAccess', _28 => _28[key]]);
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
    if (!_optionalChain([field, 'optionalAccess', _29 => _29.key]))
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
      const raw = normalizeMetafields(collection.metafields, collectionMetafields);
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

// src/core/createBaseClient.ts
function createShopifyClient(config) {
  const { fetchShopify } = createSharedShopify(config);
  return {
    fetchShopify,
    getProduct: (args) => getProduct(fetchShopify, args),
    getCollection: (args) => getCollection(fetchShopify, args)
  };
}


exports.createShopifyClient = createShopifyClient;
//# sourceMappingURL=index.js.map