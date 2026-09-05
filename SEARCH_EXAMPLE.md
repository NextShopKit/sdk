# Search Functionality

The `getSearchResult` function provides powerful search capabilities consistent with your existing `getCollection` pattern.

## Basic Usage

```typescript
import { createShopifyClient } from "nextshopkit";

const client = createShopifyClient({
  shop: "your-shop.myshopify.com",
  token: "your-storefront-access-token",
});

// Basic search
const searchResults = await client.getSearchResult({
  query: "winter jacket",
});

console.log(searchResults.products); // Array of products
console.log(searchResults.totalCount); // Total number of results
console.log(searchResults.pageInfo); // Pagination info
```

## Advanced Usage

```typescript
// Search with filters and options
const advancedSearch = await client.getSearchResult({
  query: "shoes",
  limit: 20,
  sortKey: "PRICE",
  reverse: false,
  types: ["PRODUCT"], // Can include 'ARTICLE', 'PAGE'
  productFilters: [
    { available: true },
    { price: { min: 50, max: 200 } },
    { productTag: "sale" },
  ],
  prefix: "LAST", // Partial word matching
  unavailableProducts: "HIDE", // 'SHOW', 'HIDE', 'LAST'
  productMetafields: [{ namespace: "custom", key: "material" }],
  variantMetafields: [{ namespace: "custom", key: "size_guide" }],
  options: {
    camelizeKeys: true,
    resolveFiles: true,
    renderRichTextAsHtml: false,
  },
});
```

## Pagination

```typescript
// First page
const firstPage = await client.getSearchResult({
  query: "sneakers",
  limit: 12,
});

// Next page
if (firstPage.pageInfo?.hasNextPage) {
  const nextPage = await client.getSearchResult({
    query: "sneakers",
    limit: 12,
    cursor: firstPage.pageInfo.endCursor,
  });
}
```

## Search Types

```typescript
// Search across different content types
const mixedSearch = await client.getSearchResult({
  query: "sustainability",
  types: ["PRODUCT", "ARTICLE", "PAGE"],
});
```

## Response Structure

```typescript
interface FetchSearchResult {
  products: Product[]; // Array of matching products
  pageInfo: ProductsPageInfo | null; // Pagination information
  availableFilters?: FilterGroup[]; // Available filters for refinement
  totalCount?: number; // Total number of search results
  searchTerm: string; // Echo of the search query
  error: string | null; // Error message if any
}
```

## Search Query Syntax

The search supports Shopify's advanced query syntax:

```typescript
// Field-specific search
await client.getSearchResult({ query: "title:jacket" });

// Range search
await client.getSearchResult({ query: "price:>50 price:<=100" });

// Boolean operators
await client.getSearchResult({ query: "winter AND (jacket OR coat)" });

// Phrase search
await client.getSearchResult({ query: '"winter jacket"' });

// Wildcard search
await client.getSearchResult({ query: "jack*" });
```

## Error Handling

```typescript
const result = await client.getSearchResult({
  query: "shoes",
});

if (result.error) {
  console.error("Search failed:", result.error);
} else {
  console.log("Found", result.totalCount, "results");
  console.log("Products:", result.products);
}
```
