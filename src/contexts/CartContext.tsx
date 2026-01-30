"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Product } from "../lib/products";
import { Coupon } from "../lib/coupons";

export interface CartItem extends Product {
  quantity: number;
  selectedColor: string;
  selectedSize?: string; // For products with size options
  selectedVariantId?: string; // NEW: Track which variant was selected
  lineKey: string; // Stable identifier for this cart line
}

interface CartContextType {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  addToCart: (
    product: Product,
    color: string,
    quantity?: number,
    size?: string,
    variantId?: string,
  ) => void;
  removeFromCart: (
    productId: number,
    color: string,
    size?: string,
    variantId?: string,
  ) => void;
  removeLine: (lineKey: string) => void;
  updateQuantity: (
    productId: number,
    color: string,
    quantity: number,
    size?: string,
    variantId?: string,
  ) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  setAppliedCoupon: (coupon: Coupon | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load cart from localStorage on mount
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        try {
          const parsed: any[] = JSON.parse(savedCart);
          // Ensure each item has a lineKey for stable identity/removal
          return parsed.map((it) => {
            // Generate consistent lineKey
            const lineKey =
              it.lineKey ||
              (it.selectedVariantId
                ? `${it.id}|v|${it.selectedVariantId}`
                : `${it.id}|l|${it.selectedColor || ""}|${it.selectedSize || ""}`);

            return {
              ...it,
              lineKey,
              // Ensure required fields are present
              selectedColor: it.selectedColor || "",
              selectedSize: it.selectedSize || undefined,
              selectedVariantId: it.selectedVariantId || undefined,
            };
          });
        } catch (error) {
          console.error("Error loading cart from localStorage:", error);
          return [];
        }
      }
      return [];
    }
    return [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items]);

  const addToCart = (
    product: Product,
    color: string,
    quantity: number = 1,
    size?: string,
    variantId?: string,
  ) => {
    setItems((currentItems) => {
      // NEW: Match by variantId if available, otherwise fallback to color/size
      const existingItem = currentItems.find((item) => {
        if (variantId) {
          return item.id === product.id && item.selectedVariantId === variantId;
        }
        return (
          item.id === product.id &&
          item.selectedColor === color &&
          item.selectedSize === size
        );
      });

      if (existingItem) {
        return currentItems.map((item) => {
          if (variantId) {
            return item.id === product.id &&
              item.selectedVariantId === variantId
              ? { ...item, quantity: item.quantity + quantity }
              : item;
          }
          return item.id === product.id &&
            item.selectedColor === color &&
            item.selectedSize === size
            ? { ...item, quantity: item.quantity + quantity }
            : item;
        });
      }

      // Determine the correct price
      let productPrice = product.price;

      // NEW: Use variant price if available
      if (variantId && product.variants) {
        const variant = product.variants.find((v) => v.id === variantId);
        if (variant) {
          productPrice = variant.price;
        }
      }
      // LEGACY: Fallback to size option price
      else if (product.sizeOptions && size) {
        const selectedSizeOption = product.sizeOptions.find(
          (s) => s.label === size,
        );
        if (selectedSizeOption) {
          productPrice = selectedSizeOption.price;
        }
      }

      return [
        ...currentItems,
        {
          ...product,
          price: productPrice,
          quantity,
          selectedColor: color,
          selectedSize: size,
          selectedVariantId: variantId,
          lineKey: variantId
            ? `${product.id}|v|${variantId}`
            : `${product.id}|l|${color}|${size ?? ""}`,
        },
      ];
    });
  };

  const removeLine = (lineKey: string) => {
    if (!lineKey) {
      return;
    }

    setItems((currentItems) => {
      return currentItems.filter((item) => item.lineKey !== lineKey);
    });
  };

  const removeFromCart = (
    productId: number,
    color: string,
    size?: string,
    variantId?: string,
  ) => {
    const targetKey = variantId
      ? `${productId}|v|${variantId}`
      : `${productId}|l|${color || ""}|${size || ""}`;

    removeLine(targetKey);
  };

  const updateQuantity = (
    productId: number,
    color: string,
    quantity: number,
    size?: string,
    variantId?: string,
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, color, size, variantId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (variantId) {
          return item.id === productId && item.selectedVariantId === variantId
            ? { ...item, quantity }
            : item;
        }
        return item.id === productId &&
          item.selectedColor === color &&
          item.selectedSize === size
          ? { ...item, quantity }
          : item;
      }),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        appliedCoupon,
        addToCart,
        removeFromCart,
        removeLine,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        setAppliedCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
