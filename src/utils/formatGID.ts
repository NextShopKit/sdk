/**
 * Formats a raw ID into a Shopify Global ID (GID).
 * Returns: "gid://shopify/{resource}/{id}"
 *
 * @param id - Raw ID (e.g., "123456789").
 * @param resource - Shopify resource name (e.g., "Collection", "Product").
 * @returns Shopify GID string (e.g., "gid://shopify/Collection/123456789").
 */
export function formatGID(id: string, resource: string): string {
    if (!id || !resource) throw new Error("Both id and resource are required.");
    return `gid://shopify/${resource}/${id}`;
}
