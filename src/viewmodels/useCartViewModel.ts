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
import { calculateTotalAvailable } from '@/models/Inventory';

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

  // Listen for logout events to clear cart
  useEffect(() => {
    const handleLogout = () => {
      setItems([]);
      setAppliedCoupon(null);
    };

    window.addEventListener('user-logout', handleLogout);
    return () => window.removeEventListener('user-logout', handleLogout);
  }, []);

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
  ): { success: boolean; error?: string; availableStock?: number } => {
    // Input validation
    if (!product) {
      console.error('addToCart: Product is required');
      return { success: false, error: 'Product is required' };
    }

    if (!product.active) {
      console.error('addToCart: Product is inactive');
      return { success: false, error: 'This product is no longer available' };
    }

    if (!variantId) {
      console.error('addToCart: VariantId is required');
      return { success: false, error: 'Please select a variant' };
    }

    if (!color || color.trim().length === 0) {
      console.error('addToCart: Color is required');
      return { success: false, error: 'Please select a color' };
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      console.error('addToCart: Invalid quantity');
      return { success: false, error: 'Invalid quantity' };
    }

    // Check cart size limit (only for new items, not quantity updates)
    const lineKey = generateLineKey(product.id, variantId, color, size);
    const existingItem = items.find(item => item.lineKey === lineKey);

    if (!existingItem && items.length >= 50) {
      console.error('addToCart: Cart size limit reached');
      return {
        success: false,
        error: 'Maximum 50 different items allowed in cart. Please remove some items before adding more.'
      };
    }

    // Validate variant exists and is active
    const variant = product.variants?.find(v => v.id === variantId);
    if (!variant) {
      console.error('addToCart: Variant not found');
      return { success: false, error: 'Selected variant not found' };
    }

    if (!variant.active) {
      console.error('addToCart: Variant is inactive');
      return { success: false, error: 'Selected variant is no longer available' };
    }

    // Calculate available stock for this variant
    const availableStock = calculateTotalAvailable(variant.warehouseStock);

    // Check stock availability (reuse lineKey and existingItem from above)
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > availableStock) {
        console.error(`addToCart: Requested quantity (${newQuantity}) exceeds available stock (${availableStock})`);
        return {
          success: false,
          error: `Cannot add ${quantity} more. You already have ${existingItem.quantity} in cart and only ${availableStock} available in stock.`,
          availableStock
        };
      }
    } else {
      if (quantity > availableStock) {
        console.error(`addToCart: Requested quantity (${quantity}) exceeds available stock (${availableStock})`);
        return {
          success: false,
          error: `Only ${availableStock} ${availableStock === 1 ? 'item' : 'items'} available in stock.`,
          availableStock
        };
      }
    }

    // All validation passed, add to cart
    setItems(currentItems => {
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        return currentItems.map(item =>
          item.lineKey === lineKey
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      // Determine price from variant
      const price = variant.price;

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

    return { success: true };
  }, [items]);

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

    // Validate quantity is a number
    if (!Number.isInteger(quantity)) {
      console.error('updateQuantity: Quantity must be an integer');
      return;
    }

    // If quantity is 0 or negative, remove the item
    if (quantity <= 0) {
      removeLine(lineKey);
      return;
    }

    // Inventory validation will be done inside setItems where we have access to the product

    setItems(currentItems => {
      const item = currentItems.find(i => i.lineKey === lineKey);

      if (!item) {
        console.error('updateQuantity: Item not found in cart');
        return currentItems;
      }

      // Validate against available stock
      if (item.product) {
        const variant = item.product.variants?.find(v => v.id === item.variantId);
        if (variant) {
          const availableStock = calculateTotalAvailable(variant.warehouseStock);
          if (quantity > availableStock) {
            console.error(`updateQuantity: Requested quantity (${quantity}) exceeds available stock (${availableStock})`);
            return currentItems;
          }
        }
      }

      return currentItems.map(i =>
        i.lineKey === lineKey
          ? { ...i, quantity }
          : i
      );
    });
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
