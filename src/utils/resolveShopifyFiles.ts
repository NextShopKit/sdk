import { FetchShopify, FetchOptions } from "@t";

const FILES_QUERY = `
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

export async function resolveShopifyFiles(
  fileIds: string[],
  fetchShopify: FetchShopify,
  options: FetchOptions
): Promise<Record<string, any>> {
  const resultMap: Record<string, any> = {};
  if (fileIds.length === 0) return resultMap;

  try {
    const res = await fetchShopify(FILES_QUERY, { ids: fileIds }, options);
    const nodes = res.data?.nodes || [];

    for (const file of nodes) {
      if (!file?.id) continue;

      switch (file.__typename) {
        case "GenericFile":
          resultMap[file.id] = file;
          break;

        case "MediaImage":
          resultMap[file.id] = {
            id: file.id,
            url: file.image?.url,
            alt: file.image?.altText ?? null,
          };
          break;

        case "MediaVideo":
          resultMap[file.id] = {
            id: file.id,
            videoSources: file.sources,
          };
          break;

        case "ExternalVideo":
          resultMap[file.id] = {
            id: file.id,
            embedUrl: file.embedUrl,
            host: file.host,
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
