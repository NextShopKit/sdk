"use client";

import { createContext, useEffect, useState } from "react";
import {
  ShopifyCart,
  BuyerIdentityInput,
  CartAttribute,
  LineItemInput,
  CartProviderProps,
  CartProviderConfig,
} from "@t";
import { merge } from "lodash-es";

import { error, log, castCartAttributes } from "@utils";

const defaultConfig: CartProviderConfig = {
  productMetafields: [],
  variantMetafields: [],
  customAttributes: [],
  options: {
    resolveFiles: false,
    renderRichTextAsHtml: false,
    camelizeKeys: true,
    lineLimit: 250,
  },
};

export interface CartContextType {
  cart: ShopifyCart | null;
  loading: boolean;
  addProducts: (lines: LineItemInput[]) => Promise<void>;
  removeProduct: (lineId: string) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  applyDiscountCode: (code: string) => Promise<void>;
  removeDiscountCode: () => Promise<void>;
  emptyCart: () => Promise<void>;
  mergeCarts: (sourceCartId: string) => Promise<void>;
  updateBuyerIdentity: (buyerIdentity: BuyerIdentityInput) => Promise<void>;
  updateCartAttributes: (attributes: CartAttribute[]) => Promise<void>;
  setCartAttribute: (key: string, value: string) => Promise<void>;
  removeCartAttribute: (key: string) => Promise<void>;
  resetCart: () => Promise<void>;
  totalCount: number;
  totalPrice: number;
  typedCartAttributes: Record<string, any>;
}

export const CartContext = createContext<CartContextType | undefined>(
  undefined
);

export function CartProvider({
  children,
  client,
  debug = false,
  config,
}: CartProviderProps) {
  const mergedConfig = merge({}, defaultConfig, config);
  const [typedCartAttributes, setTypedCartAttributes] = useState<
    Record<string, any>
  >({});

  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  useEffect(() => {
    const init = async () => {
      debug && log("[CartContext] Initializing cart...");
      const storedCartId = localStorage.getItem("shopify_cart_id");
      debug && log("[CartContext] Found cart ID:", storedCartId);

      try {
        let initialCart: ShopifyCart;
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
      if (e.key === "shopify_cart_id") init();
    });
  }, [client]);

  const updateCartState = async (cart: ShopifyCart) => {
    if (debug && process.env.NODE_ENV === "development") {
      log("[CartContext] Updating cart state:", {
        id: cart.id,
        checkoutUrl: cart.checkoutUrl,
        totalAmount: cart.cost?.totalAmount,
        lineCount: cart.lines.length,
      });
      log("[CartContext] Lines:", cart.lines);
    }

    setCart(cart);

    const total = cart.lines.reduce(
      (sum, line) => sum + (line.quantity || 0),
      0
    );
    const price = cart.cost?.totalAmount?.amount || 0;

    setTotalCount(total);
    setTotalPrice(price);

    // ✅ Handle typed attributes
    const definitions = mergedConfig.customAttributes ?? [];
    const transform = mergedConfig.options?.transformCartAttributes;

    if (definitions.length > 0) {
      const casted = await castCartAttributes(
        cart.attributes ?? [],
        definitions,
        transform
      );
      setTypedCartAttributes(casted);
    } else {
      setTypedCartAttributes({});
    }
  };

  const addProducts = async (lines: LineItemInput[]) => {
    if (!cart) return;
    debug && log("[CartContext] Adding products:", lines);
    setLoading(true);

    try {
      const existingLines = cart.lines || [];

      // Single item logic: check for duplicate and update
      if (lines.length === 1) {
        const { merchandiseId, quantity } = lines[0];

        const existing = existingLines.find(
          (line) => line.merchandise?.id === merchandiseId
        );

        if (existing) {
          const newQty = existing.quantity + (quantity || 1);
          debug &&
            log(
              `[CartContext] Updating quantity of ${merchandiseId} to ${newQty}`
            );
          const updated = await client.updateCartItem(
            cart.id,
            existing.id,
            newQty
          );
          updateCartState(updated);
          return;
        }
      }

      // Otherwise, just add all lines as-is
      const updated = await client.addToCart(cart.id, lines, mergedConfig);
      debug && log("[CartContext] Cart after adding:", updated);
      updateCartState(updated);
    } catch (err) {
      debug && error("[CartContext] Error in addProducts:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (lineId: string) => {
    if (!cart) return;
    debug && log("[CartContext] Removing product with line ID:", lineId);
    setLoading(true);
    const updated = await client.removeFromCart(cart.id, lineId);
    debug && log("[CartContext] Cart after removal:", updated);
    updateCartState(updated);
    setLoading(false);
  };

  const updateQuantity = async (lineId: string, quantity: number) => {
    if (!cart) return;
    debug && log("[CartContext] Updating quantity:", { lineId, quantity });
    setLoading(true);

    try {
      if (quantity <= 0) {
        debug && log("[CartContext] Quantity is 0, removing product instead");
        const updated = await client.removeFromCart(cart.id, lineId);
        debug && log("[CartContext] Cart after removal:", updated);
        updateCartState(updated);
      } else {
        const updated = await client.updateCartItem(cart.id, lineId, quantity);
        debug && log("[CartContext] Cart after quantity update:", updated);
        updateCartState(updated);
      }
    } catch (err) {
      debug && error("[CartContext] Error in updateQuantity:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyDiscountCode = async (code: string) => {
    if (!cart) return;
    debug && log("[CartContext] Applying discount code:", code);
    setLoading(true);
    const updated = await client.applyDiscount(cart.id, code);
    debug && log("[CartContext] Cart after discount:", updated);
    updateCartState(updated);
    setLoading(false);
  };

  const removeDiscountCode = async () => {
    if (!cart) return;
    debug && log("[CartContext] Removing discount code...");
    setLoading(true);
    const updated = await client.removeDiscount(cart.id);
    debug && log("[CartContext] Cart after removing discount:", updated);
    updateCartState(updated);
    setLoading(false);
  };

  const emptyCart = async () => {
    if (!cart) return;
    debug && log("[CartContext] Emptying cart...");
    setLoading(true);
    const updated = await client.emptyCart(cart.id);
    debug && log("[CartContext] Cart after emptying:", updated);
    updateCartState(updated);
    setLoading(false);
  };

  const mergeCarts = async (sourceCartId: string) => {
    if (!cart) return;
    debug && log("[CartContext] Merging carts:", sourceCartId, "into", cart.id);
    setLoading(true);
    const updated = await client.mergeCarts(sourceCartId, cart.id);
    debug && log("[CartContext] Cart after merging:", updated);
    updateCartState(updated);
    setLoading(false);
  };

  const updateBuyerIdentity = async (buyerIdentity: BuyerIdentityInput) => {
    if (!cart) return;
    debug && log("[CartContext] Updating buyer identity:", buyerIdentity);
    setLoading(true);
    const updated = await client.updateBuyerIdentity(cart.id, buyerIdentity);
    debug && log("[CartContext] Cart after buyer identity update:", updated);
    updateCartState(updated);
    setLoading(false);
  };

  const updateCartAttributes = async (attributes: CartAttribute[]) => {
    if (!cart) return;
    debug && log("[CartContext] Updating cart attributes:", attributes);
    setLoading(true);
    const updated = await client.updateCartAttributes(cart.id, attributes);
    debug && log("[CartContext] Cart after attribute update:", updated);
    updateCartState(updated);
    setLoading(false);
  };

  const setCartAttribute = async (key: string, value: string) => {
    if (!cart) return;

    debug && log("[CartContext] Setting cart attribute:", { key, value });

    const existing = cart.attributes ?? [];

    const updated: CartAttribute[] = [
      ...existing.filter((attr) => attr.key !== key),
      { key, value },
    ];

    debug && log("[CartContext] Updated cart attributes:", updated);

    await updateCartAttributes(updated);
  };

  const removeCartAttribute = async (key: string) => {
    if (!cart) return;

    debug && log("[CartContext] Removing cart attribute:", key);

    const existing = cart.attributes ?? [];

    const updated = existing.filter((attr) => attr.key !== key);

    debug &&
      log("[CartContext] Updated cart attributes after removal:", updated);

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

  return (
    <CartContext.Provider
      value={{
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
        removeCartAttribute,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
