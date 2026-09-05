# getProductVariant

> **Tier:** Pro

Fetch a single product variant by ID or options.

## Usage

```ts
const variant = await client.getProductVariant({ id: "gid://..." });
```

## Example

```ts
const variant = await client.getProductVariant({ id: "gid://..." });
console.log(variant.price);
```

## Relevant Types

- `GetProductVariantOptions`
- `FetchProductVariantResult`
