"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/entries/client.sdk.ts
var client_sdk_exports = {};
__export(client_sdk_exports, {
  CartProvider: () => CartProvider,
  useCart: () => useCart
});
module.exports = __toCommonJS(client_sdk_exports);

// src/components/CartProvider.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var CartContext = (0, import_react.createContext)(
  void 0
);
function CartProvider({
  children,
  client
}) {
  const [cart, setCart] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [totalCount, setTotalCount] = (0, import_react.useState)(0);
  const [totalPrice, setTotalPrice] = (0, import_react.useState)(0);
  (0, import_react.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
var import_react2 = require("react");
function useCart() {
  const context = (0, import_react2.useContext)(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
//# sourceMappingURL=client.sdk.js.map