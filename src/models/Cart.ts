/**
 * Cart Domain Models
 * 
 * Pure data structures for shopping cart.
 */

import { Product } from './Product';
import { Coupon } from './Coupon';

export interface CartItem {
  // Product reference
  productId: number;
  variantId?: string;
  
  // Product details (snapshot at time of add)
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  
  // Selection details
  selectedColor: string;
  selectedSize?: string;
  quantity: number;
  
  // Unique identifier for this cart line
  lineKey: string;
  
  // Full product data (for display/validation)
  product?: Product;
}

export interface Cart {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

/**
 * Generate unique line key for cart item
 */
export function generateLineKey(
  productId: number,
  variantId?: string,
  color?: string,
  size?: string
): string {
  if (variantId) {
    return `${productId}|v|${variantId}`;
  }
  return `${productId}|l|${color || ''}|${size || ''}`;
}

/**
 * Calculate cart subtotal
 */
export function calculateCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Calculate cart item count
 */
export function calculateCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Find cart item by line key
 */
export function findCartItem(
  items: CartItem[],
  lineKey: string
): CartItem | undefined {
  return items.find(item => item.lineKey === lineKey);
}

/**
 * Check if product/variant is in cart
 */
export function isInCart(
  items: CartItem[],
  productId: number,
  variantId?: string,
  color?: string,
  size?: string
): boolean {
  const lineKey = generateLineKey(productId, variantId, color, size);
  return items.some(item => item.lineKey === lineKey);
}
