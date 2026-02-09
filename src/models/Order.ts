/**
 * Order Domain Models
 * 
 * Pure data structures for order-related entities.
 */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'cash' | 'gcash' | 'bank';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';
export type FulfillmentType = 'pickup' | 'delivery';
export type RefundStatus = 'pending' | 'approved' | 'rejected';

export interface OrderItem {
  id?: string;
  productId: number;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  color: string;
  size?: string;
  imageUrl: string;
  warehouseSource?: 'Lorenzo' | 'Oroquieta';
  refundRequested?: boolean;
  refundReason?: string;
  refundStatus?: RefundStatus;
  refundProof?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  barangay: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface PickupDetails {
  pickupPerson: string;
  pickupPhone: string;
  pickupDate?: string;
  deliveryService?: string;
  trackingNumber?: string;
}

export interface PaymentDetails {
  gcashNumber?: string;
  gcashReference?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  bankReference?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  couponDiscount: number;
  couponId?: string;
  couponCode?: string;
  total: number;
  isReservation: boolean;
  reservationFee?: number;
  reservationPercentage?: number;
  status: OrderStatus;
  fulfillment: FulfillmentType;
  pickupDetails?: PickupDetails;
  shippingAddress?: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProof?: string;
  paymentDetails?: PaymentDetails;
  paymentVerifiedAt?: string;
  verifiedBy?: string;
  isManualOrder: boolean;
  createdBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculate order totals
 */
export function calculateOrderTotal(
  subtotal: number,
  deliveryFee: number,
  couponDiscount: number
): number {
  return Math.max(0, subtotal + deliveryFee - couponDiscount);
}

/**
 * Check if order can be cancelled
 */
export function canCancelOrder(order: Order): boolean {
  return order.status === 'pending' || order.status === 'confirmed';
}

/**
 * Check if order is eligible for refund
 */
export function isRefundEligible(order: Order): boolean {
  if (order.status !== 'completed') return false;
  
  const completedDate = new Date(order.updatedAt);
  const now = new Date();
  const daysSinceCompleted = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceCompleted <= 7;
}

/**
 * Get order status display text
 */
export function getOrderStatusDisplay(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    pending: 'Pending Payment',
    confirmed: 'Payment Confirmed',
    processing: 'Processing Order',
    ready: 'Ready for Pickup',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  
  return statusMap[status] || status;
}
