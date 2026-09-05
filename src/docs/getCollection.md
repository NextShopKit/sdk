# getCollection

> **Tier:** Core (SDK) & Pro

Fetch a collection and its products by handle, ID, or options. Supports filtering, pagination, and metafields.

## Usage

```ts
const collection = await client.getCollection({ handle: "summer-collection" });
```

## Example

```ts
import { createShopifyClient } from "@nextshopkit/sdk";
const client = createShopifyClient({
  /* ... */
});

const collection = await client.getCollection({ handle: "summer" });
```

## Relevant Types

- `GetCollectionOptions`
- `FetchCollectionResult`
