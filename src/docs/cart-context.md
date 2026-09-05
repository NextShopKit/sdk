# Cart Context (CartProvider & useCart)

> **Tier:** Core (SDK) & Pro

React context provider and hook for cart state management. Use in your app to provide and consume cart state/actions.

## Usage

```tsx
import { CartProvider } from "@nextshopkit/sdk/client";
import { useCart } from "@nextshopkit/sdk/client";

<CartProvider client={client}>
  <YourApp />
</CartProvider>

const { cart, addProducts, removeProduct, updateQuantity, emptyCart, ... } = useCart();
```

## Example

```tsx
// _app.tsx or layout.tsx
<CartProvider client={client}>{children}</CartProvider>;

// In a component
const { cart, addProducts, removeProduct } = useCart();
```

## Relevant Types

- `CartProviderProps`
- `CartProviderConfig`
- `CartContextType`
