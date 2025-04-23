"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/shared/utils/resolveShopifyFiles.ts
var FILES_QUERY = `
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
async function resolveShopifyFiles(fileIds, fetchShopify, options) {
  const resultMap = {};
  if (fileIds.length === 0)
    return resultMap;
  try {
    const res = await fetchShopify(FILES_QUERY, { ids: fileIds }, options);
    const nodes = _optionalChain([res, 'access', _ => _.data, 'optionalAccess', _2 => _2.nodes]) || [];
    for (const file of nodes) {
      if (!_optionalChain([file, 'optionalAccess', _3 => _3.id]))
        continue;
      switch (file.__typename) {
        case "GenericFile":
          resultMap[file.id] = file;
          break;
        case "MediaImage":
          resultMap[file.id] = {
            id: file.id,
            url: _optionalChain([file, 'access', _4 => _4.image, 'optionalAccess', _5 => _5.url]),
            alt: _nullishCoalesce(_optionalChain([file, 'access', _6 => _6.image, 'optionalAccess', _7 => _7.altText]), () => ( null))
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


exports.resolveShopifyFiles = resolveShopifyFiles;
//# sourceMappingURL=resolveShopifyFiles-5F5332JW.js.map