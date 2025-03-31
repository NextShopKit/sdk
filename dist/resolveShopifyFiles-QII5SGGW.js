"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/shared/utils/resolveShopifyFiles.ts
var FILES_QUERY = `
    query getFiles($ids: [ID!]!) {
    nodes(ids: $ids) {
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
    }
    }
`;
async function resolveShopifyFiles(fileIds, fetchShopify) {
  const resultMap = {};
  if (fileIds.length === 0)
    return resultMap;
  try {
    const res = await fetchShopify(FILES_QUERY, { ids: fileIds });
    const nodes = _optionalChain([res, 'access', _ => _.data, 'optionalAccess', _2 => _2.nodes]) || [];
    for (const file of nodes) {
      if (_optionalChain([file, 'optionalAccess', _3 => _3.id])) {
        resultMap[file.id] = file;
      }
    }
    return resultMap;
  } catch (err) {
    console.error("Error resolving files:", err);
    return resultMap;
  }
}


exports.resolveShopifyFiles = resolveShopifyFiles;
//# sourceMappingURL=resolveShopifyFiles-QII5SGGW.js.map