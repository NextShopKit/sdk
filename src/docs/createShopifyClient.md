# createShopifyClient

> **Tier:** Core (SDK) & Pro

Creates a Shopify client instance with built-in caching, cart, and product/collection helpers.

## Usage

```ts
import { createShopifyClient } from "@nextshopkit/sdk";

const client = createShopifyClient({
  shop: "your-shop.myshopify.com",
  token: "your-storefront-access-token",
  apiVersion: "2025-04",
  enableMemoryCache: true,
  defaultCacheTtl: 300,
  enableVercelCache: true,
  defaultRevalidate: 60,
});
```

## Example

```ts
const product = await client.getProduct({ handle: "my-product" });
const collection = await client.getCollection({ handle: "my-collection" });
```

## Relevant Types

- `ShopifyClientConfig`
- `ShopifyProClient`

---

- Returns: `ShopifyProClient` instance
- See also: [getProduct.md](./getProduct.md), [getCollection.md](./getCollection.md), [cart-functions.md](./cart-functions.md)
