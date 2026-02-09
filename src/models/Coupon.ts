/**
 * Coupon Domain Models
 * 
 * Pure data structures for coupon/discount system.
 */

export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number; // Percentage (10 = 10%) or Fixed amount (500 = ₱500)
  minPurchase: number;
  maxDiscount?: number;
  expiryDate: string; // ISO date string
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
  discountAmount?: number;
}

/**
 * Calculate discount amount based on coupon type
 */
export function calculateCouponDiscount(
  coupon: Coupon,
  subtotal: number
): number {
  if (coupon.discountType === 'percentage') {
    const discount = subtotal * (coupon.discountValue / 100);
    return coupon.maxDiscount 
      ? Math.min(discount, coupon.maxDiscount)
      : discount;
  }
  
  return coupon.discountValue;
}

/**
 * Check if coupon is expired
 */
export function isCouponExpired(coupon: Coupon): boolean {
  return new Date(coupon.expiryDate) < new Date();
}

/**
 * Check if coupon has reached usage limit
 */
export function isCouponAtLimit(coupon: Coupon): boolean {
  return coupon.usedCount >= coupon.usageLimit;
}

/**
 * Check if purchase meets minimum requirement
 */
export function meetsMinimumPurchase(coupon: Coupon, subtotal: number): boolean {
  return subtotal >= coupon.minPurchase;
}
