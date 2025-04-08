// src/shared/utils/resolveShopifyFiles.ts
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
async function resolveShopifyFiles(fileIds, fetchShopify, options) {
  const resultMap = {};
  if (fileIds.length === 0)
    return resultMap;
  try {
    const res = await fetchShopify(FILES_QUERY, { ids: fileIds }, options);
    const nodes = res.data?.nodes || [];
    for (const file of nodes) {
      if (file?.id) {
        resultMap[file.id] = file;
      }
    }
    return resultMap;
  } catch (err) {
    console.error("Error resolving files:", err);
    return resultMap;
  }
}
export {
  resolveShopifyFiles
};
//# sourceMappingURL=resolveShopifyFiles-KIZKOVIG.mjs.map