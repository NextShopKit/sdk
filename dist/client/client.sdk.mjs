// src/components/CartProvider.tsx
import { createContext, useEffect, useState } from "react";
import { jsx } from "react/jsx-runtime";
var CartContext = createContext(
  void 0
);
function CartProvider({
  children,
  client,
  debug = false
}) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const isDev = true;
  const log = (...args) => {
    if (isDev && debug)
      console.log("[CartContext]", ...args);
  };
  useEffect(() => {
    const init = async () => {
      console.log("[CartContext] Initializing cart...");
      const storedCartId = localStorage.getItem("shopify_cart_id");
      console.log("[CartContext] Found cart ID:", storedCartId);
      try {
        let initialCart;
        if (storedCartId) {
          initialCart = await client.getCart(storedCartId);
          console.log("[CartContext] Fetched existing cart:", initialCart);
        } else {
          initialCart = await client.createCart();
          localStorage.setItem("shopify_cart_id", initialCart.id);
          console.log("[CartContext] Created new cart:", initialCart);
        }
        if (!initialCart || !initialCart.id) {
          console.error("[CartContext] Invalid cart received:", initialCart);
        } else {
          updateCartState(initialCart);
          console.log("[CartContext] Cart initialized successfully");
        }
      } catch (err) {
        console.error("[CartContext] Cart init error", err);
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
    let flatLines = [];
    if (Array.isArray(cart2.lines)) {
      flatLines = cart2.lines;
    } else if (cart2.lines && typeof cart2.lines === "object" && "edges" in cart2.lines && Array.isArray(cart2.lines.edges)) {
      flatLines = cart2.lines.edges.map(
        (edge) => edge.node
      );
    }
    if (debug && true) {
      console.log("[CartContext] Updating cart state:", {
        id: cart2.id,
        checkoutUrl: cart2.checkoutUrl,
        totalAmount: cart2.cost?.totalAmount,
        lineCount: flatLines.length
      });
      console.log("[CartContext] Lines:", flatLines);
    }
    setCart({ ...cart2, lines: flatLines });
    const total = flatLines.reduce(
      (sum, line) => sum + (line.quantity || 0),
      0
    );
    const price = parseFloat(cart2.cost?.totalAmount?.amount || "0");
    setTotalCount(total);
    setTotalPrice(price);
  };
  const addProducts = async (lines) => {
    if (!cart)
      return;
    log("Adding products:", lines);
    setLoading(true);
    const updated = await client.addToCart(cart.id, lines);
    log("Cart after adding:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const removeProduct = async (lineId) => {
    if (!cart)
      return;
    log("Removing product with line ID:", lineId);
    setLoading(true);
    const updated = await client.removeFromCart(cart.id, lineId);
    log("Cart after removal:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const updateQuantity = async (lineId, quantity) => {
    if (!cart)
      return;
    log("Updating quantity:", { lineId, quantity });
    setLoading(true);
    const updated = await client.updateCartItem(cart.id, lineId, quantity);
    log("Cart after quantity update:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const applyDiscountCode = async (code) => {
    if (!cart)
      return;
    log("Applying discount code:", code);
    setLoading(true);
    const updated = await client.applyDiscount(cart.id, code);
    log("Cart after discount:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const removeDiscountCode = async () => {
    if (!cart)
      return;
    log("Removing discount code...");
    setLoading(true);
    const updated = await client.removeDiscount(cart.id);
    log("Cart after removing discount:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const emptyCart = async () => {
    if (!cart)
      return;
    log("Emptying cart...");
    setLoading(true);
    const updated = await client.emptyCart(cart.id);
    log("Cart after emptying:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const mergeCarts = async (sourceCartId) => {
    if (!cart)
      return;
    log("Merging carts:", sourceCartId, "into", cart.id);
    setLoading(true);
    const updated = await client.mergeCarts(sourceCartId, cart.id);
    log("Cart after merging:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const updateBuyerIdentity = async (buyerIdentity) => {
    if (!cart)
      return;
    log("Updating buyer identity:", buyerIdentity);
    setLoading(true);
    const updated = await client.updateBuyerIdentity(cart.id, buyerIdentity);
    log("Cart after buyer identity update:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const updateCartAttributes = async (attributes) => {
    if (!cart)
      return;
    log("Updating cart attributes:", attributes);
    setLoading(true);
    const updated = await client.updateCartAttributes(cart.id, attributes);
    log("Cart after attribute update:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const resetCart = async () => {
    log("Resetting cart...");
    setLoading(true);
    const newCart = await client.createCart();
    localStorage.setItem("shopify_cart_id", newCart.id);
    log("New cart created:", newCart);
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