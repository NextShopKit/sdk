# getSearchResult

> **Tier:** Core (SDK) & Pro

Search for products, collections, or other resources. Supports filters, pagination, and sorting.

## Usage

```ts
const result = await client.getSearchResult({ query: "shoes" });
```

## Example

```ts
const result = await client.getSearchResult({
  query: "t-shirt",
  limit: 10,
  productFilters: [{ key: "tag", value: "summer" }],
  sortKey: "PRICE",
  reverse: true,
});
```

## Relevant Types

- `GetSearchResultOptions`
- `FetchSearchResult`
