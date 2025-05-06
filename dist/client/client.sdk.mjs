// src/components/CartProvider.tsx
import { createContext, useEffect, useState } from "react";
import { merge } from "lodash-es";

// src/utils/log.ts
var isDev = true;
function log(...args) {
  if (isDev) {
    console.log(...args);
  }
}
function error(...args) {
  if (isDev) {
    console.error(...args);
  }
}

// src/utils/castCartAttributes.ts
async function castCartAttributes(rawAttributes, definitions, transformCartAttributes) {
  const casted = {};
  const resolved = [];
  for (const def of definitions) {
    const raw = rawAttributes.find((attr) => attr.key === def.key)?.value;
    resolved.push({
      key: def.key,
      type: def.type,
      value: raw ?? ""
    });
    casted[def.key] = raw === void 0 ? null : castValue(raw, def.type);
  }
  if (typeof transformCartAttributes === "function") {
    return await transformCartAttributes(rawAttributes, casted, resolved);
  }
  return casted;
}
function castValue(value, type) {
  switch (type) {
    case "boolean":
      return value === "true";
    case "integer":
      return parseInt(value, 10);
    case "decimal":
      return parseFloat(value);
    case "json":
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    case "date":
      return new Date(value);
    default:
      return value;
  }
}

// src/components/CartProvider.tsx
import { jsx } from "react/jsx-runtime";
var defaultConfig = {
  productMetafields: [],
  variantMetafields: [],
  customAttributes: [],
  options: {
    resolveFiles: false,
    renderRichTextAsHtml: false,
    camelizeKeys: true,
    lineLimit: 250
  }
};
var CartContext = createContext(
  void 0
);
function CartProvider({
  children,
  client,
  debug = false,
  config
}) {
  const mergedConfig = merge({}, defaultConfig, config);
  const [typedCartAttributes, setTypedCartAttributes] = useState({});
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  useEffect(() => {
    const init = async () => {
      debug && log("[CartContext] Initializing cart...");
      const storedCartId = localStorage.getItem("shopify_cart_id");
      debug && log("[CartContext] Found cart ID:", storedCartId);
      try {
        let initialCart;
        if (storedCartId) {
          initialCart = await client.getCart(storedCartId, mergedConfig);
          debug && log("[CartContext] Fetched existing cart:", initialCart);
        } else {
          initialCart = await client.createCart();
          localStorage.setItem("shopify_cart_id", initialCart.id);
          debug && log("[CartContext] Created new cart:", initialCart);
        }
        if (!initialCart || !initialCart.id) {
          debug && error("[CartContext] Invalid cart received:", initialCart);
        } else {
          updateCartState(initialCart);
          debug && log("[CartContext] Cart initialized successfully");
        }
      } catch (err) {
        debug && error("[CartContext] Cart init error", err);
      }
      setLoading(false);
    };
    init();
    window.addEventListener("storage", (e) => {
      if (e.key === "shopify_cart_id")
        init();
    });
  }, [client]);
  const updateCartState = async (cart2) => {
    if (debug && true) {
      log("[CartContext] Updating cart state:", {
        id: cart2.id,
        checkoutUrl: cart2.checkoutUrl,
        totalAmount: cart2.cost?.totalAmount,
        lineCount: cart2.lines.length
      });
      log("[CartContext] Lines:", cart2.lines);
    }
    setCart(cart2);
    const total = cart2.lines.reduce(
      (sum, line) => sum + (line.quantity || 0),
      0
    );
    const price = parseFloat(cart2.cost?.totalAmount?.amount || "0");
    setTotalCount(total);
    setTotalPrice(price);
    const definitions = mergedConfig.customAttributes ?? [];
    const transform = mergedConfig.options?.transformCartAttributes;
    if (definitions.length > 0) {
      const casted = await castCartAttributes(
        cart2.attributes ?? [],
        definitions,
        transform
      );
      setTypedCartAttributes(casted);
    } else {
      setTypedCartAttributes({});
    }
  };
  const addProducts = async (lines) => {
    if (!cart)
      return;
    debug && log("[CartContext] Adding products:", lines);
    setLoading(true);
    try {
      const existingLines = cart.lines || [];
      if (lines.length === 1) {
        const { merchandiseId, quantity } = lines[0];
        const existing = existingLines.find(
          (line) => line.merchandise?.id === merchandiseId
        );
        if (existing) {
          const newQty = existing.quantity + (quantity || 1);
          debug && log(
            `[CartContext] Updating quantity of ${merchandiseId} to ${newQty}`
          );
          const updated2 = await client.updateCartItem(
            cart.id,
            existing.id,
            newQty
          );
          updateCartState(updated2);
          return;
        }
      }
      const updated = await client.addToCart(cart.id, lines, mergedConfig);
      debug && log("[CartContext] Cart after adding:", updated);
      updateCartState(updated);
    } catch (err) {
      debug && error("[CartContext] Error in addProducts:", err);
    } finally {
      setLoading(false);
    }
  };
  const removeProduct = async (lineId) => {
    if (!cart)
      return;
    debug && log("[CartContext] Removing product with line ID:", lineId);
    setLoading(true);
    const updated = await client.removeFromCart(cart.id, lineId);
    debug && log("[CartContext] Cart after removal:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const updateQuantity = async (lineId, quantity) => {
    if (!cart)
      return;
    debug && log("[CartContext] Updating quantity:", { lineId, quantity });
    setLoading(true);
    const updated = await client.updateCartItem(cart.id, lineId, quantity);
    debug && log("[CartContext] Cart after quantity update:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const applyDiscountCode = async (code) => {
    if (!cart)
      return;
    debug && log("[CartContext] Applying discount code:", code);
    setLoading(true);
    const updated = await client.applyDiscount(cart.id, code);
    debug && log("[CartContext] Cart after discount:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const removeDiscountCode = async () => {
    if (!cart)
      return;
    debug && log("[CartContext] Removing discount code...");
    setLoading(true);
    const updated = await client.removeDiscount(cart.id);
    debug && log("[CartContext] Cart after removing discount:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const emptyCart = async () => {
    if (!cart)
      return;
    debug && log("[CartContext] Emptying cart...");
    setLoading(true);
    const updated = await client.emptyCart(cart.id);
    debug && log("[CartContext] Cart after emptying:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const mergeCarts = async (sourceCartId) => {
    if (!cart)
      return;
    debug && log("[CartContext] Merging carts:", sourceCartId, "into", cart.id);
    setLoading(true);
    const updated = await client.mergeCarts(sourceCartId, cart.id);
    debug && log("[CartContext] Cart after merging:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const updateBuyerIdentity = async (buyerIdentity) => {
    if (!cart)
      return;
    debug && log("[CartContext] Updating buyer identity:", buyerIdentity);
    setLoading(true);
    const updated = await client.updateBuyerIdentity(cart.id, buyerIdentity);
    debug && log("[CartContext] Cart after buyer identity update:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const updateCartAttributes = async (attributes) => {
    if (!cart)
      return;
    debug && log("[CartContext] Updating cart attributes:", attributes);
    setLoading(true);
    const updated = await client.updateCartAttributes(cart.id, attributes);
    debug && log("[CartContext] Cart after attribute update:", updated);
    updateCartState(updated);
    setLoading(false);
  };
  const setCartAttribute = async (key, value) => {
    if (!cart)
      return;
    debug && log("[CartContext] Setting cart attribute:", { key, value });
    const existing = cart.attributes ?? [];
    const updated = [
      ...existing.filter((attr) => attr.key !== key),
      { key, value }
    ];
    debug && log("[CartContext] Updated cart attributes:", updated);
    await updateCartAttributes(updated);
  };
  const removeCartAttribute = async (key) => {
    if (!cart)
      return;
    debug && log("[CartContext] Removing cart attribute:", key);
    const existing = cart.attributes ?? [];
    const updated = existing.filter((attr) => attr.key !== key);
    debug && log("[CartContext] Updated cart attributes after removal:", updated);
    await updateCartAttributes(updated);
  };
  const resetCart = async () => {
    debug && log("[CartContext] Resetting cart...");
    setLoading(true);
    const newCart = await client.createCart();
    localStorage.setItem("shopify_cart_id", newCart.id);
    debug && log("[CartContext] New cart created:", newCart);
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
        totalPrice,
        typedCartAttributes,
        setCartAttribute,
        removeCartAttribute
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