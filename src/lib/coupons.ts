export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // Percentage (e.g., 10 for 10%) or Fixed amount (e.g., 500 for ₱500)
  minPurchase: number; // Minimum purchase amount required
  maxDiscount?: number; // Maximum discount amount (for percentage coupons)
  expiryDate: string; // ISO date string
  usageLimit: number; // Total number of times this coupon can be used
  usedCount: number; // Number of times this coupon has been used
  isActive: boolean;
  createdAt: string;
}

const defaultCoupons: Coupon[] = [
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
  {
    id: '3',
    code: 'FURNITURE15',
    description: '15% off on all furniture items',
    discountType: 'percentage',
    discountValue: 15,
    minPurchase: 2000,
    maxDiscount: 1000,
    expiryDate: '2025-12-31',
    usageLimit: 200,
    usedCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Initialize coupons in localStorage if not exists
if (typeof window !== 'undefined') {
  const storedCoupons = localStorage.getItem('coupons');
  if (!storedCoupons) {
    localStorage.setItem('coupons', JSON.stringify(defaultCoupons));
  }
}

// Get coupons from localStorage or use default
export const getCoupons = (): Coupon[] => {
  if (typeof window === 'undefined') return defaultCoupons;
  const stored = localStorage.getItem('coupons');
  return stored ? JSON.parse(stored) : defaultCoupons;
};

// Validate and apply coupon
export const validateCoupon = (
  code: string,
  subtotal: number
): { valid: boolean; coupon?: Coupon; error?: string } => {
  const coupons = getCoupons();
  const coupon = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase());

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
      error: `Minimum purchase of ₱${coupon.minPurchase.toLocaleString('en-PH', { minimumFractionDigits: 2 })} required`,
    };
  }

  return { valid: true, coupon };
};

// Calculate discount amount
export const calculateDiscount = (coupon: Coupon, subtotal: number): number => {
  if (coupon.discountType === 'percentage') {
    const discount = (subtotal * coupon.discountValue) / 100;
    // Apply max discount limit if specified
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      return coupon.maxDiscount;
    }
    return discount;
  } else {
    // Fixed discount
    return coupon.discountValue;
  }
};

// Increment usage count
export const useCoupon = (couponId: string): void => {
  const coupons = getCoupons();
  const updatedCoupons = coupons.map((c) =>
    c.id === couponId ? { ...c, usedCount: c.usedCount + 1 } : c
  );
  localStorage.setItem('coupons', JSON.stringify(updatedCoupons));
};

// CRUD operations for admin
export const addCoupon = (coupon: Omit<Coupon, 'id' | 'createdAt'>): Coupon => {
  const coupons = getCoupons();
  const newId = (Math.max(...coupons.map((c) => parseInt(c.id)), 0) + 1).toString();
  const newCoupon = {
    ...coupon,
    id: newId,
    createdAt: new Date().toISOString(),
  };
  const updatedCoupons = [...coupons, newCoupon];
  localStorage.setItem('coupons', JSON.stringify(updatedCoupons));
  return newCoupon;
};

export const updateCoupon = (id: string, updates: Partial<Coupon>): void => {
  const coupons = getCoupons();
  const updatedCoupons = coupons.map((c) => (c.id === id ? { ...c, ...updates } : c));
  localStorage.setItem('coupons', JSON.stringify(updatedCoupons));
};

export const deleteCoupon = (id: string): void => {
  // Soft delete - set isActive to false instead of removing
  const coupons = getCoupons();
  const updatedCoupons = coupons.map((c) => 
    c.id === id ? { ...c, isActive: false } : c
  );
  localStorage.setItem('coupons', JSON.stringify(updatedCoupons));
};

export const getCouponById = (id: string): Coupon | undefined => {
  return getCoupons().find((c) => c.id === id);
};

// Return/unreserve coupon usage when order is cancelled or refunded
export const returnCoupon = (couponId: string): void => {
  const coupons = getCoupons();
  const updatedCoupons = coupons.map((c) =>
    c.id === couponId ? { ...c, usedCount: Math.max(0, c.usedCount - 1) } : c
  );
  localStorage.setItem('coupons', JSON.stringify(updatedCoupons));
};