# @nextshopkit/sdk

> A modern, typed, and developer-friendly SDK for building Shopify headless storefronts with Next.js.

---

![npm](https://img.shields.io/npm/v/@nextshopkit/sdk)  
[📖 Full Documentation →](https://docs.nextshopkit.com/)

---

## ⚡️ Why @nextshopkit/sdk?

Building a headless storefront with Shopify’s Storefront API can be challenging — repetitive GraphQL queries, vague errors, and lots of boilerplate.

`@nextshopkit/sdk` solves that with:

- ✅ Prebuilt typed functions (e.g. `getProduct`, `getProducts`)
- 🧠 Metafield parsing and transformation
- 🛒 Cart operations out of the box
- 🔐 Server-only logic, safe by default
- 🧩 Optional PRO features like metaobjects, blogs, search (coming soon)

Whether you're building a small shop or scaling a full e-commerce platform — this SDK helps you **move faster with confidence**.

---

## 📦 Installation

```bash
npm install @nextshopkit/sdk
# or
yarn add @nextshopkit/sdk
```

Add these to your `.env.local` file:

```env
SHOPIFY_ACCESS_TOKEN=your-storefront-access-token
SHOPIFY_STORE_DOMAIN=your-shop.myshopify.com
```

> These credentials are used securely on the server only. Never expose them to the client.

---

## 🚀 Quick Start

Create a Shopify client:

```ts
import { createShopifyClient } from "@nextshopkit/sdk";

const client = createShopifyClient({
  shop: process.env.SHOPIFY_STORE_DOMAIN!,
  token: process.env.SHOPIFY_ACCESS_TOKEN!,
  apiVersion: "2025-01",
});
```

Fetch a product:

```ts
const { data, error } = await client.getProduct({
  handle: "my-product-handle",
});

if (error || !data) {
  throw new Error("Product not found");
}

console.log(data.title, data.price.amount);
```

---

## 🧱 Core Features

- ✅ `getProduct`, `getProducts`, `getCollections`
- 🛒 `createCart`, `addToCart`, `removeFromCart`
- 🎯 Custom metafields with built-in type casting
- 🧠 Transform and normalize Shopify data
- ⚙️ Compatible with **Next.js App Router** and **Pages Router**
- 🔐 Works only on server — never leaks credentials

---

## 🚀 PRO Tier (coming soon)

Unlock advanced headless features with the PRO version:

- Metaobjects
- Blog posts and articles
- Product recommendations
- Smart filtering and search
- Localization (multi-region support)

💡 PRO will require a license key, assigned automatically after purchase.

---

## 📖 Documentation

Full docs with examples, filters, types, and setup guides:

👉 [nextshopkit.dev/docs](https://your-docs-url.com)

---

## ❓ FAQs

- ✅ Free forever? Yes — CORE is open source and always will be.
- ✅ SEO-friendly? Yes — works with SSR, SSG, and dynamic routing.
- ✅ Uses GraphQL? Yes — under the hood, but you never write it manually.

Read full [FAQs →](https://your-docs-url.com/getting-started/faqs)

---

## 💬 Support & Community

- [Open an issue](https://github.com/your-org/nextshopkit-sdk/issues)
- [Twitter / X](https://twitter.com/your-handle)
- [Discord](#) (coming soon)

---

<!-- ## ☕ Support This Project

If you find this SDK helpful, you can support its development by:

- [☕ Buying me a coffee](#)
- 🛍️ Purchasing official **storefront templates**
- 🎓 Enrolling in the upcoming **Headless Shopify Course**

--- -->

Built with ❤️ for the Next.js + Shopify.
