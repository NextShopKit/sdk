# getProductVariants

> **Tier:** Pro

Fetch multiple product variants by IDs or options.

## Usage

```ts
const variants = await client.getProductVariants({
  ids: ["gid://...", "gid://..."],
});
```

## Example

```ts
const variants = await client.getProductVariants({
  ids: ["gid://...", "gid://..."],
});
console.log(variants[0].price);
```

## Relevant Types

- `GetProductVariantsOptions`
- `FetchProductVariantsResult`
