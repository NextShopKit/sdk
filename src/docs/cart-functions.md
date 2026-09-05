# Cart Functions

> **Tier:** Core (SDK) & Pro

Programmatic cart actions available on the client instance. Use these for SSR, API routes, or custom logic.

## Usage

```ts
const cart = await client.createCart();
const cart = await client.getCart(cartId);
await client.addToCart(cartId, lines);
await client.removeFromCart(cartId, lineId);
await client.updateCartItem(cartId, lineId, quantity);
await client.emptyCart(cartId);
await client.applyDiscount(cartId, code);
await client.removeDiscount(cartId);
await client.updateCartAttributes(cartId, attributes);
await client.updateBuyerIdentity(cartId, buyerIdentity);
await client.mergeCarts(sourceCartId, destinationCartId);
```

## Example

```ts
const cart = await client.createCart();
await client.addToCart(cart.id, [{ merchandiseId: "gid://...", quantity: 2 }]);
```

## Relevant Types

- `ShopifyCart`
- `LineItemInput`
- `CartAttribute`
- `BuyerIdentityInput`
- `CartProviderConfig`
