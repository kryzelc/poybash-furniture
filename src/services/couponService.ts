/**
 * Coupon Service
 * 
 * Handles all coupon-related API operations and data persistence.
 */

import { supabase } from './supabaseClient';
import { Coupon, CouponValidationResult, calculateCouponDiscount } from '@/models/Coupon';

class CouponService {
  /**
   * Get all active coupons
   */
  async getActiveCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      return this.getFallbackCoupons();
    }

    return this.mapToCoupons(data);
  }

  /**
   * Validate coupon code (client-side check)
   */
  async validateCoupon(
    code: string,
    subtotal: number
  ): Promise<CouponValidationResult> {
    try {
      const coupons = await this.getActiveCoupons();
      const coupon = coupons.find(
        c => c.code.toUpperCase() === code.toUpperCase()
      );

      if (!coupon) {
        return { valid: false, error: 'Invalid coupon code' };
      }

      if (!coupon.isActive) {
        return { valid: false, error: 'This coupon is no longer active' };
      }

      if (coupon.usedCount >= coupon.usageLimit) {
        return { valid: false, error: 'This coupon has reached its usage limit' };
      }

      const expiryDate = new Date(coupon.expiryDate);
      if (expiryDate < new Date()) {
        return { valid: false, error: 'This coupon has expired' };
      }

      if (subtotal < coupon.minPurchase) {
        return {
          valid: false,
          error: `Minimum purchase of ₱${coupon.minPurchase.toLocaleString()} required`,
        };
      }

      const discountAmount = calculateCouponDiscount(coupon, subtotal);

      return {
        valid: true,
        coupon,
        discountAmount,
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { valid: false, error: 'Failed to validate coupon' };
    }
  }

  /**
   * Validate coupon via Edge Function (server-side with rate limiting)
   */
  async validateCouponViaEdgeFunction(
    code: string,
    subtotal: number
  ): Promise<CouponValidationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { code, subtotal },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as CouponValidationResult;
    } catch (error) {
      console.error('Error validating coupon via edge function:', error);
      // Fallback to client-side validation
      return this.validateCoupon(code, subtotal);
    }
  }

  /**
   * Use/increment coupon usage count
   */
  async useCoupon(couponId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_coupon_usage', {
      coupon_id: couponId,
    });

    if (error) {
      console.error('Error using coupon:', error);
      throw new Error('Failed to apply coupon');
    }
  }

  /**
   * Return/decrement coupon usage (when order is cancelled)
   */
  async returnCoupon(couponId: string): Promise<void> {
    const { error } = await supabase.rpc('decrement_coupon_usage', {
      coupon_id: couponId,
    });

    if (error) {
      console.error('Error returning coupon:', error);
    }
  }

  /**
   * Create new coupon (Admin only)
   */
  async createCoupon(coupon: Omit<Coupon, 'id' | 'createdAt' | 'usedCount'>): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discountType,
        discount_value: coupon.discountValue,
        min_purchase: coupon.minPurchase,
        max_discount: coupon.maxDiscount,
        expiry_date: coupon.expiryDate,
        usage_limit: coupon.usageLimit,
        is_active: coupon.isActive,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create coupon: ${error.message}`);
    }

    return this.mapToCoupon(data);
  }

  /**
   * Update coupon (Admin only)
   */
  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .update({
        code: updates.code,
        description: updates.description,
        discount_type: updates.discountType,
        discount_value: updates.discountValue,
        min_purchase: updates.minPurchase,
        max_discount: updates.maxDiscount,
        expiry_date: updates.expiryDate,
        usage_limit: updates.usageLimit,
        is_active: updates.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update coupon: ${error.message}`);
    }

    return this.mapToCoupon(data);
  }

  /**
   * Delete coupon (Admin only - soft delete)
   */
  async deleteCoupon(id: string): Promise<void> {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete coupon: ${error.message}`);
    }
  }

  // Private helpers

  private mapToCoupon(data: any): Coupon {
    return {
      id: data.id,
      code: data.code,
      description: data.description,
      discountType: data.discount_type,
      discountValue: data.discount_value,
      minPurchase: data.min_purchase,
      maxDiscount: data.max_discount,
      expiryDate: data.expiry_date,
      usageLimit: data.usage_limit,
      usedCount: data.used_count,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToCoupons(data: any[]): Coupon[] {
    return data.map(item => this.mapToCoupon(item));
  }

  /**
   * Fallback coupons (for development/testing)
   */
  private getFallbackCoupons(): Coupon[] {
    return [
      {
        id: '1',
        code: 'WELCOME10',
        description: 'Welcome discount - 10% off your first purchase',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 1000,
        maxDiscount: 500,
        expiryDate: '2025-12-31',
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        code: 'SAVE500',
        description: '₱500 off on purchases ₱5,000 and above',
        discountType: 'fixed',
        discountValue: 500,
        minPurchase: 5000,
        expiryDate: '2025-12-31',
        usageLimit: 50,
        usedCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

// Export singleton instance
export const couponService = new CouponService();
