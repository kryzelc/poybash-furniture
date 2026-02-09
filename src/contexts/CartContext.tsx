/**
 * Cart Context - REFACTORED to MVVM
 * 
 * This context now only provides global state access.
 * All business logic is in useCartViewModel.
 */

"use client";

import {
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useCartViewModel } from "@/viewmodels/useCartViewModel";
import { CartItem, Cart } from "@/models/Cart";
import { Product } from "@/models/Product";
import { Coupon } from "@/models/Coupon";

interface CartContextType {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
  cart: Cart;
  addToCart: (
    product: Product,
    color: string,
    quantity?: number,
    size?: string,
    variantId?: string
  ) => { success: boolean; error?: string; availableStock?: number };
  removeFromCart: (
    productId: number,
    color: string,
    size?: string,
    variantId?: string
  ) => void;
  removeLine: (lineKey: string) => void;
  updateQuantity: (
    productId: number,
    color: string,
    quantity: number,
    size?: string,
    variantId?: string
  ) => void;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  setAppliedCoupon: (coupon: Coupon | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Use ViewModel for all business logic
  const viewModel = useCartViewModel();

  // Provide both new and legacy API for backwards compatibility
  const contextValue: CartContextType = {
    ...viewModel,
    // Legacy methods (for backwards compatibility)
    getCartTotal: () => viewModel.total,
    getCartCount: () => viewModel.itemCount,
    setAppliedCoupon: (coupon) => {
      if (coupon) {
        viewModel.applyCoupon(coupon);
      } else {
        viewModel.removeCoupon();
      }
    },
  };

  return (
    <CartContext.Provider value={contextValue}>
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
