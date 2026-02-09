/**
 * Cart ViewModel
 * 
 * Manages shopping cart business logic and state.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CartItem,
  Cart,
  generateLineKey,
  calculateCartSubtotal,
  calculateCartItemCount,
} from '@/models/Cart';
import { Product } from '@/models/Product';
import { Coupon, calculateCouponDiscount } from '@/models/Coupon';

const CART_STORAGE_KEY = 'cart';
const COUPON_STORAGE_KEY = 'appliedCoupon';

export function useCartViewModel() {
  // State
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return [];
    
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((item: any) => ({
        ...item,
        lineKey: item.lineKey || generateLineKey(
          item.productId,
          item.variantId,
          item.selectedColor,
          item.selectedSize
        ),
      }));
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    if (typeof window === 'undefined') return null;
    
    const saved = localStorage.getItem(COUPON_STORAGE_KEY);
    if (!saved) return null;
    
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  // Persist cart to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  // Persist coupon to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    }
  }, [appliedCoupon]);

  // Calculations
  const subtotal = useMemo(() => calculateCartSubtotal(items), [items]);
  const itemCount = useMemo(() => calculateCartItemCount(items), [items]);
  const discount = useMemo(() => 
    appliedCoupon ? calculateCouponDiscount(appliedCoupon, subtotal) : 0,
    [appliedCoupon, subtotal]
  );
  const total = useMemo(() => subtotal - discount, [subtotal, discount]);

  // Actions
  const addToCart = useCallback((
    product: Product,
    color: string,
    quantity: number = 1,
    size?: string,
    variantId?: string
  ) => {
    setItems(currentItems => {
      const lineKey = generateLineKey(product.id, variantId, color, size);
      const existingItem = currentItems.find(item => item.lineKey === lineKey);

      if (existingItem) {
        return currentItems.map(item =>
          item.lineKey === lineKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      // Determine price from variant
      let price = product.price;
      if (variantId && product.variants.length > 0) {
        const variant = product.variants.find(v => v.id === variantId);
        if (variant) price = variant.price;
      }

      const newItem: CartItem = {
        productId: product.id,
        variantId,
        name: product.name,
        price,
        imageUrl: product.imageUrl,
        category: product.category,
        selectedColor: color,
        selectedSize: size,
        quantity,
        lineKey,
        product,
      };

      return [...currentItems, newItem];
    });
  }, []);

  const removeFromCart = useCallback((
    productId: number,
    color: string,
    size?: string,
    variantId?: string
  ) => {
    const lineKey = generateLineKey(productId, variantId, color, size);
    setItems(currentItems => currentItems.filter(item => item.lineKey !== lineKey));
  }, []);

  const removeLine = useCallback((lineKey: string) => {
    setItems(currentItems => currentItems.filter(item => item.lineKey !== lineKey));
  }, []);

  const updateQuantity = useCallback((
    productId: number,
    color: string,
    quantity: number,
    size?: string,
    variantId?: string
  ) => {
    const lineKey = generateLineKey(productId, variantId, color, size);
    
    if (quantity <= 0) {
      removeLine(lineKey);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.lineKey === lineKey
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeLine]);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
  }, []);

  const applyCoupon = useCallback((coupon: Coupon) => {
    setAppliedCoupon(coupon);
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  // Cart summary
  const cart: Cart = useMemo(() => ({
    items,
    appliedCoupon,
    subtotal,
    discount,
    total,
    itemCount,
  }), [items, appliedCoupon, subtotal, discount, total, itemCount]);

  return {
    // State
    items,
    appliedCoupon,
    subtotal,
    discount,
    total,
    itemCount,
    cart,
    
    // Actions
    addToCart,
    removeFromCart,
    removeLine,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
  };
}
