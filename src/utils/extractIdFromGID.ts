/**
 * Extracts the numeric or string ID from a Shopify GID (Global ID).
 * Shopify GIDs look like: "gid://shopify/Collection/123456789"
 *
 * @param gid - The Shopify GID string.
 * @returns The extracted ID string (e.g., "123456789").
 */
export function extractIdFromGID(gid: string): string {
    if (!gid || typeof gid !== "string") return gid;
    const parts = gid.split("/");
    return parts[parts.length - 1];
}
