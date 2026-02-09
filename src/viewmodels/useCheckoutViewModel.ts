/**
 * Checkout ViewModel
 * 
 * Manages checkout business logic including validation, coupon application, and order placement.
 */

import { useState, useCallback, useMemo } from 'react';
import { CartItem } from '@/models/Cart';
import { Coupon } from '@/models/Coupon';
import { CreateOrderInput } from '@/services/orderService';
import { couponService } from '@/services/couponService';
import { inventoryService } from '@/services/inventoryService';
import { Product } from '@/models/Product';

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  barangay: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CheckoutPaymentDetails {
  gcashNumber?: string;
  gcashReference?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  bankReference?: string;
}

export function useCheckoutViewModel(cartItems: CartItem[]) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Calculate totals
  const subtotal = useMemo(() => 
    cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [cartItems]
  );

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discountType === 'percentage') {
      const disc = subtotal * (appliedCoupon.discountValue / 100);
      return appliedCoupon.maxDiscount 
        ? Math.min(disc, appliedCoupon.maxDiscount)
        : disc;
    }
    
    return appliedCoupon.discountValue;
  }, [appliedCoupon, subtotal]);

  const deliveryFee = 0; // Free delivery for now
  const total = useMemo(() => 
    Math.max(0, subtotal + deliveryFee - discount),
    [subtotal, deliveryFee, discount]
  );

  // Apply coupon
  const applyCoupon = useCallback(async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await couponService.validateCouponViaEdgeFunction(code, subtotal);

      if (!result.valid || !result.coupon) {
        setError(result.error || 'Invalid coupon');
        return { success: false, error: result.error };
      }

      setAppliedCoupon(result.coupon);
      return { success: true, coupon: result.coupon };
    } catch (err) {
      const errorMessage = 'Failed to apply coupon';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [subtotal]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  // Validate stock availability
  const validateStock = useCallback(async () => {
    try {
      const items = cartItems.map(item => ({
        product: item.product!,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const result = inventoryService.validateStockAvailability(items);

      if (!result.available) {
        const errors = result.errors.map(e => e.error).join(', ');
        setError(errors);
        return { available: false, errors: result.errors };
      }

      return { available: true, errors: [] };
    } catch (err) {
      setError('Failed to validate stock');
      return { available: false, errors: [] };
    }
  }, [cartItems]);

  // Allocate warehouse sources
  const allocateWarehouses = useCallback(() => {
    const items = cartItems.map(item => ({
      product: item.product!,
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    return inventoryService.allocateWarehouseSources(items);
  }, [cartItems]);

  // Validate form data
  const validateForm = useCallback((formData: CheckoutFormData) => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  // Build order data
  const buildOrderData = useCallback((
    formData: CheckoutFormData,
    deliveryMethod: 'pickup' | 'delivery',
    paymentMethod: 'cash' | 'gcash' | 'bank',
    paymentProof?: string,
    paymentDetails?: CheckoutPaymentDetails,
    pickupDetails?: any
  ): Partial<CreateOrderInput> => {
    // Get warehouse allocations
    const allocation = allocateWarehouses();

    if (!allocation.success) {
      throw new Error(allocation.errors.join(', '));
    }

    // Map cart items to order items with warehouse sources
    const orderItems = cartItems.map(cartItem => {
      const allocated = allocation.allocatedItems.find(
        a => a.productId === cartItem.productId && a.variantId === cartItem.variantId
      );

      return {
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        name: cartItem.name,
        price: cartItem.price,
        quantity: cartItem.quantity,
        color: cartItem.selectedColor,
        size: cartItem.selectedSize,
        imageUrl: cartItem.imageUrl,
        warehouseSource: allocated?.warehouseSource,
      };
    });

    return {
      items: orderItems,
      subtotal,
      deliveryFee,
      couponDiscount: discount,
      couponId: appliedCoupon?.id,
      total,
      isReservation: false,
      fulfillment: deliveryMethod,
      shippingAddress: formData,
      pickupDetails,
      paymentMethod,
      paymentProof,
      paymentDetails,
    };
  }, [cartItems, subtotal, deliveryFee, discount, total, appliedCoupon, allocateWarehouses]);

  return {
    // State
    isLoading,
    error,
    appliedCoupon,
    formErrors,
    subtotal,
    discount,
    deliveryFee,
    total,
    
    // Actions
    applyCoupon,
    removeCoupon,
    validateStock,
    validateForm,
    buildOrderData,
    setError,
    setFormErrors,
  };
}
