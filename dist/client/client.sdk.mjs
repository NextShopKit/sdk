// src/components/CartProvider.tsx
import { createContext, useEffect, useState } from "react";
import { jsx } from "react/jsx-runtime";
var CartContext = createContext(
  void 0
);
function CartProvider({
  children,
  client
}) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  useEffect(() => {
    const init = async () => {
      const storedCartId = localStorage.getItem("shopify_cart_id");
      try {
        let initialCart;
        if (storedCartId) {
          initialCart = await client.getCart(storedCartId);
        } else {
          initialCart = await client.createCart();
          localStorage.setItem("shopify_cart_id", initialCart.id);
        }
        updateCartState(initialCart);
      } catch (err) {
        console.error("Cart init error", err);
      }
      setLoading(false);
    };
    init();
    window.addEventListener("storage", (e) => {
      if (e.key === "shopify_cart_id")
        init();
    });
  }, [client]);
  const updateCartState = (cart2) => {
    setCart(cart2);
    const total = cart2.lines.reduce(
      (sum, line) => sum + (line.quantity || 0),
      0
    );
    const price = parseFloat(cart2.cost.totalAmount.amount || "0");
    setTotalCount(total);
    setTotalPrice(price);
  };
  const addProducts = async (lines) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.addToCart(cart.id, lines);
    updateCartState(updated);
    setLoading(false);
  };
  const addMultipleProducts = async (lines) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.addMultipleLines(cart.id, lines);
    updateCartState(updated);
    setLoading(false);
  };
  const removeProduct = async (lineId) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.removeFromCart(cart.id, lineId);
    updateCartState(updated);
    setLoading(false);
  };
  const updateQuantity = async (lineId, quantity) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.updateCartItem(cart.id, lineId, quantity);
    updateCartState(updated);
    setLoading(false);
  };
  const applyDiscountCode = async (code) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.applyDiscount(cart.id, code);
    updateCartState(updated);
    setLoading(false);
  };
  const removeDiscountCode = async () => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.removeDiscount(cart.id);
    updateCartState(updated);
    setLoading(false);
  };
  const emptyCart = async () => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.emptyCart(cart.id);
    updateCartState(updated);
    setLoading(false);
  };
  const mergeCarts = async (sourceCartId) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.mergeCarts(sourceCartId, cart.id);
    updateCartState(updated);
    setLoading(false);
  };
  const updateBuyerIdentity = async (buyerIdentity) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.updateBuyerIdentity(cart.id, buyerIdentity);
    updateCartState(updated);
    setLoading(false);
  };
  const updateCartAttributes = async (attributes) => {
    if (!cart)
      return;
    setLoading(true);
    const updated = await client.updateCartAttributes(cart.id, attributes);
    updateCartState(updated);
    setLoading(false);
  };
  const resetCart = async () => {
    setLoading(true);
    const newCart = await client.createCart();
    localStorage.setItem("shopify_cart_id", newCart.id);
    updateCartState(newCart);
    setLoading(false);
  };
  return /* @__PURE__ */ jsx(
    CartContext.Provider,
    {
      value: {
        cart,
        loading,
        addProducts,
        addMultipleProducts,
        removeProduct,
        updateQuantity,
        applyDiscountCode,
        removeDiscountCode,
        emptyCart,
        mergeCarts,
        updateBuyerIdentity,
        updateCartAttributes,
        resetCart,
        totalCount,
        totalPrice
      },
      children
    }
  );
}

// src/hooks/useCart.ts
import { useContext } from "react";
function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
export {
  CartProvider,
  useCart
};
//# sourceMappingURL=client.sdk.mjs.map