# @nextshopkit/sdk

> A modern, type-safe, and framework-flexible SDK for building Shopify headless storefronts — built for React, optimized for Next.js.

---

[![npm](https://img.shields.io/npm/v/@nextshopkit/sdk)](https://www.npmjs.com/package/@nextshopkit/sdk)  
[📖 Full Documentation →](https://docs.nextshopkit.com/)

---

## ⚡️ Why @nextshopkit/sdk?

Headless Shopify is powerful — but using the Storefront GraphQL API directly is painful:

- Complex queries for simple needs
- Inconsistent metafield handling
- Lots of repeated boilerplate
- No opinionated support for modern frontend workflows

`@nextshopkit/sdk` simplifies this with:

- ✅ Prebuilt, type-safe SDK functions (e.g. `getProduct`, `createCart`)
- 🧠 Metafield parsing and normalization helpers
- 🛒 Cart management powered by React Context (soon)
- 🔐 Server-only by design — credentials never leak
- 🧩 Plug-and-play with Next.js, but **not locked in** to any framework

Whether you're building a custom store with **Next.js**, **Remix**, or plain **React**, this SDK gives you the power of Shopify — without the lock-in.

---

## 💡 When to Use This SDK

You want to build a Shopify storefront with:

- Full control over your frontend (headless)
- Familiar tools like Next.js and Vercel
- Zero reliance on Shopify’s Oxygen or Hydrogen stack

Then `@nextshopkit/sdk` is for you.

---

## 📦 Installation

```bash
npm install @nextshopkit/sdk
# or
yarn add @nextshopkit/sdk
```

Then, add to your `.env.local`:

```env
SHOPIFY_ACCESS_TOKEN=your-storefront-access-token
SHOPIFY_STORE_DOMAIN=your-shop.myshopify.com
```

---

## 🚀 Quick Start

```ts
import { createShopifyClient } from "@nextshopkit/sdk";

const client = createShopifyClient({
  shop: process.env.SHOPIFY_STORE_DOMAIN!,
  token: process.env.SHOPIFY_ACCESS_TOKEN!,
  apiVersion: "2025-01",
});

const { data } = await client.getProduct({ handle: "my-product-handle" });

console.log(data.title, data.price.amount);
```

---

## 🧱 Core Features

- ✅ `getProduct`, `getProducts`, `getCollections`
- 🛒 `createCart`, `addToCart`, `removeFromCart` with React Context
- 🎯 Custom metafields with type casting & normalization
- 🧠 Transform raw Shopify API data into clean, typed objects
- ⚙️ Works with **Next.js App Router**, **Pages Router**, or any React app
- 🔐 Secure by default — server-only logic

---

## 🚀 PRO Tier (coming soon)

Unlock powerful features with the optional PRO upgrade:

- 🔗 Metaobjects
- ✍️ Blog posts & article APIs
- 🤖 Product recommendations
- 🔍 Smart filtering and faceted search
- 🌍 Multi-region + multilingual support

PRO will require a license key — coming soon.

---

## 📖 Documentation

Explore full setup guides, examples, type definitions, filters, and advanced use cases:

👉 [docs.nextshopkit.com](https://docs.nextshopkit.com/)

---

## ❓ FAQs

- ✅ **Free?** — The core SDK is open-source and forever free.
- ✅ **SEO-friendly?** — Works with SSR, ISR, and SSG out of the box.
- ✅ **Uses GraphQL?** — Yes, under the hood — but you never have to write it yourself.

👉 [Read full FAQs →](https://docs.nextshopkit.com/docs/getting-started/faqs)

---

## 💬 Support & Community

- Found a bug or have a feature request? [Open an issue](https://github.com/NextShopKit/sdk/issues)
- Building something cool with this? Tag us or share your project!

---

> Built with ❤️ for developers who love React, own their stack, and want to build fast.
