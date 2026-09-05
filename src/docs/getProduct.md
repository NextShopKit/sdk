# getProduct

> **Tier:** Core (SDK) & Pro

Fetch a single product by handle, ID, or options. Supports metafields, caching, and error handling.

## Usage

```ts
const product = await client.getProduct({ handle: "my-product" });
```

## Example

```ts
import { createShopifyClient } from "@nextshopkit/sdk";
const client = createShopifyClient({
  /* ... */
});

const product = await client.getProduct({ handle: "t-shirt" });
```

## Relevant Types

- `GetProductOptions`
- `FetchProductResult`
