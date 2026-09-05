# 🛍️ NextShopKit SDK

**Unmaintained — shared as a starting point for your own projects.**

NextShopKit is a TypeScript SDK for building Shopify storefronts with Next.js.
The source is available in the hope that it is useful to someone. You are welcome
to fork it, modify it, reuse parts of it, and continue development for your own
projects under the [MIT license](LICENSE).

There is no active maintenance or support, and no updates, security fixes, new
npm releases, or pull request reviews are promised. The code and examples are
provided as-is. If you build on it, you are responsible for maintaining your
fork, updating dependencies, and checking compatibility with the Shopify API
and your version of Next.js.

## Fork and build

Fork this repository on GitHub, then clone your fork (replace `YOUR-USERNAME`):

```bash
git clone https://github.com/YOUR-USERNAME/sdk.git
cd sdk
npm ci
npm run type:check
npm run build
```

The `src/` directory contains the source previously maintained in
`NextShopKit/pro-development`, including both SDK and Pro entry points.
Generated files go into `dist/`.

- `npm run build` builds the SDK and its client entry point.
- `npm run build:pro` builds the Pro entry points locally. Run `npm run build`
  again to restore the SDK output.
- `npm run dev` rebuilds the SDK as you make changes.

If you publish your fork, use your own package name and npm credentials.
The existing `@nextshopkit/sdk` npm release predates this source release;
installing it does not install changes you make in your fork.

## Existing usage examples

The examples below are retained as a reference for adapting the code. They may
need changes for current dependencies and API versions.

## 📦 Installation

```bash
npm install @nextshopkit/sdk
```

```bash
yarn add @nextshopkit/sdk
```

```bash
pnpm add @nextshopkit/sdk
```

## 🔧 Quick Setup

### 1. Environment Variables

Add to your `.env.local`:

```env
SHOPIFY_ACCESS_TOKEN=your-storefront-access-token
SHOPIFY_STORE_DOMAIN=your-shop.myshopify.com
```

### 2. Initialize Client

```ts
// lib/nextshopkit/client.ts
import { createShopifyClient } from "@nextshopkit/sdk";

const client = createShopifyClient({
  shop: process.env.SHOPIFY_STORE_DOMAIN!,
  token: process.env.SHOPIFY_ACCESS_TOKEN!,
  apiVersion: "2025-04",
  enableMemoryCache: true,
  defaultCacheTtl: 300,
  enableVercelCache: true,
  defaultRevalidate: 60,
});

export const getProduct = async (args) => client.getProduct(args);
export const getCollection = async (args) => client.getCollection(args);
export const getSearchResult = async (args) => client.getSearchResult(args);

export default client;
```

### 3. Use in Server Components

```tsx
// app/product/[handle]/page.tsx
import { getProduct } from "@/lib/nextshopkit/client";

export default async function ProductPage({ params }) {
  const { data, error } = await getProduct({
    handle: params.handle,
    customMetafields: [
      { field: "custom.warranty", type: "single_line_text" },
      { field: "custom.weight", type: "weight" },
    ],
  });

  if (error || !data) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <h1>{data.title}</h1>
      <p>
        ${data.price.amount} {data.price.currencyCode}
      </p>
      <div dangerouslySetInnerHTML={{ __html: data.descriptionHtml }} />

      {/* Access custom metafields */}
      <p>Warranty: {data.metafields.customWarranty}</p>
      <p>
        Weight: {data.metafields.customWeight?.value}{" "}
        {data.metafields.customWeight?.unit}
      </p>
    </div>
  );
}
```

## 🧩 Core Features

### 🛍️ Product Management

```ts
// Fetch single product
const { data, error } = await getProduct({
  handle: "premium-t-shirt",
  customMetafields: [
    { field: "custom.material", type: "single_line_text" },
    { field: "custom.care_instructions", type: "rich_text" },
  ],
  options: {
    camelizeKeys: true,
    renderRichTextAsHtml: true,
  },
});

// Fetch collection with filters
const collection = await getCollection({
  handle: "summer-collection",
  first: 20,
  filters: [
    { price: { min: 10, max: 100 } },
    { available: true },
    { tag: "organic" },
  ],
  sortKey: "PRICE",
  reverse: false,
});
```

### 🔍 Advanced Search

```ts
// Search across products, collections, articles
const searchResults = await getSearchResult({
  query: "organic cotton",
  types: ["PRODUCT", "COLLECTION"],
  first: 10,
  filters: [{ price: { min: 20, max: 200 } }, { productType: "Clothing" }],
  sortKey: "RELEVANCE",
});
```

### 🛒 Cart Management

```tsx
// Provider setup (app/layout.tsx)
import { CartProvider } from "@nextshopkit/sdk/client";
import { createShopifyClient } from "@nextshopkit/sdk";

// Client-side client for cart operations
const cartClient = createShopifyClient({
  shop: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!,
  token: process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN!,
  apiVersion: "2025-04",
});

export default function RootLayout({ children }) {
  return <CartProvider client={cartClient}>{children}</CartProvider>;
}

// Use in components
import { useCart } from "@nextshopkit/sdk/client";

function AddToCartButton({ variantId }) {
  const { addProducts, loading, cart } = useCart();

  return (
    <button
      onClick={() => addProducts([{ merchandiseId: variantId, quantity: 1 }])}
      disabled={loading}
    >
      Add to Cart ({cart?.totalQuantity || 0})
    </button>
  );
}
```

### 🏷️ Metafields Made Easy

```ts
// Define metafields with types
const product = await getProduct({
  handle: "laptop",
  customMetafields: [
    { field: "custom.processor", type: "single_line_text" },
    { field: "custom.ram", type: "number_integer" },
    { field: "custom.specifications", type: "rich_text" },
    { field: "custom.warranty_document", type: "file_reference" },
  ],
  options: {
    camelizeKeys: true,
    resolveFiles: true,
    renderRichTextAsHtml: true,
    transformMetafields: (raw, casted) => ({
      ...casted,
      // Create computed fields
      displaySpecs: `${casted.customProcessor} • ${casted.customRam}GB RAM`,
      warrantyYears: casted.customWarrantyDocument ? "2 years" : "1 year",
    }),
  },
});

// Access transformed metafields
console.log(product.data.metafields.displaySpecs);
console.log(product.data.metafields.warrantyYears);
```

## 🎯 Advanced Usage

### Filtering & Pagination

```ts
// Advanced collection filtering
const filteredProducts = await getCollection({
  handle: "electronics",
  first: 12,
  after: "cursor-from-previous-page",
  filters: [
    { price: { min: 100, max: 1000 } },
    { available: true },
    { variantOption: { name: "Color", value: "Black" } },
    { metafield: { namespace: "custom", key: "brand", value: "Apple" } },
  ],
  sortKey: "PRICE",
  reverse: false,
  customMetafields: [
    { field: "custom.brand", type: "single_line_text" },
    { field: "custom.rating", type: "rating" },
  ],
});
```

### Server Actions Integration

```ts
// app/actions/cart.ts
"use server";

import { getProduct } from "@/lib/nextshopkit/client";

export async function addToCartAction(
  productHandle: string,
  variantId: string
) {
  const { data, error } = await getProduct({ handle: productHandle });

  if (error || !data) {
    throw new Error("Product not found");
  }

  // Add to cart logic here
  return { success: true, product: data };
}
```

### API Routes

```ts
// app/api/products/route.ts
import { getCollection } from "@/lib/nextshopkit/client";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const handle = searchParams.get("collection");

  const { data, error } = await getCollection({
    handle: handle || "all",
    first: 20,
  });

  if (error) {
    return Response.json({ error }, { status: 500 });
  }

  return Response.json({ products: data.products });
}
```

## 🔒 Security & Best Practices

### 🔐 Secure Credential Usage

**Use appropriate environment variables for your use case:**

✅ **Server-side operations** (recommended for most data fetching):

```env
SHOPIFY_ACCESS_TOKEN=your-storefront-access-token
SHOPIFY_STORE_DOMAIN=your-shop.myshopify.com
```

✅ **Client-side operations** (required for cart functionality):

```env
NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN=your-storefront-access-token
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-shop.myshopify.com
```

### 🛡️ Security Guidelines

**For Server-side Usage:**

- Use private environment variables (without `NEXT_PUBLIC_` prefix)
- Keep credentials secure and never expose to client bundles
- Use in Server Components, API routes, and `"use server"` functions

**For Client-side Usage (Cart functionality):**

- Use `NEXT_PUBLIC_` prefixed environment variables
- Only use **Storefront API tokens** (never Admin API tokens)
- Ensure your Storefront API token has minimal required permissions
- Consider implementing rate limiting and request validation

### ⚖️ When to Use Each Approach

**Server-side (Recommended for data fetching):**

- Product pages
- Collection pages
- Search results
- Static generation
- Better performance and SEO

**Client-side (Required for interactive features):**

- Cart management (`CartProvider`, `useCart()`)
- Real-time inventory updates
- Interactive product configurators
- Dynamic user-specific content

### 🚀 Performance Optimization

```ts
// Enable caching for better performance
const client = createShopifyClient({
  shop: process.env.SHOPIFY_STORE_DOMAIN!,
  token: process.env.SHOPIFY_ACCESS_TOKEN!,
  apiVersion: "2025-04",
  enableMemoryCache: true, // In-memory caching
  defaultCacheTtl: 300, // 5 minutes
  enableVercelCache: true, // Vercel ISR caching
  defaultRevalidate: 60, // 1 minute revalidation
});
```

## 📊 Available Methods

| Method              | Description                              | Tier |
| ------------------- | ---------------------------------------- | ---- |
| `getProduct()`      | Fetch single product by handle/ID        | Core |
| `getCollection()`   | Fetch collection with products & filters | Core |
| `getSearchResult()` | Search products, collections, articles   | Core |
| `getPolicies()`     | Fetch shop policies                      | Core |
| Cart Functions      | Complete cart management                 | Core |

## Pro source

The former Pro source is included in this repository for you to explore and
adapt. Its entry point is `src/index.pro.ts`, with variant and policy helpers
such as `getProductVariant()`, `getProductVariants()`, and `getPolicy()`.

## 📚 Documentation

These are the original documentation links and may be outdated. Source-level
reference notes are also available in [`src/docs`](src/docs).

- **[Full Documentation](https://docs.nextshopkit.com)**
- **[API Reference](https://docs.nextshopkit.com/api-reference)**
- **[Examples & Guides](https://docs.nextshopkit.com/getting-started)**

## Continuing development

Forks and independent development are welcome. This repository is unmaintained,
so issues and pull requests may not receive a response. Please maintain and
share improvements through your own fork.

## 📄 License

MIT © [NextShopKit](https://nextshopkit.com)

## 🔗 Links

- **[Website](https://nextshopkit.com)**
- **[Documentation](https://docs.nextshopkit.com)**
- **[GitHub](https://github.com/NextShopKit/sdk)**
- **[NPM](https://www.npmjs.com/package/@nextshopkit/sdk)**

---

**Built with ❤️ for the Next.js and Shopify community**
