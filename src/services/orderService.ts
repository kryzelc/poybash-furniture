/**
 * Order Service
 * 
 * Handles all order-related API operations.
 */

import { supabase } from './supabaseClient';
import { Order, OrderItem, OrderStatus } from '@/models/Order';

export interface CreateOrderInput {
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  couponDiscount: number;
  couponId?: string;
  total: number;
  isReservation: boolean;
  reservationFee?: number;
  reservationPercentage?: number;
  fulfillment: 'pickup' | 'delivery';
  pickupDetails?: any;
  shippingAddress?: any;
  paymentMethod: 'cash' | 'gcash' | 'bank';
  paymentProof?: string;
  paymentDetails?: any;
  notes?: string;
}

class OrderService {
  /**
   * Create a new order via Edge Function
   */
  async createOrder(orderData: CreateOrderInput): Promise<Order> {
    try {
      const { data, error } = await supabase.functions.invoke('place-order', {
        body: orderData,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as Order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to place order');
    }
  }

  /**
   * Get orders for current user
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return this.mapToOrders(data);
  }

  /**
   * Get single order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    return this.mapToOrder(data);
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    return this.mapToOrder(data);
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single();

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    return this.mapToOrder(data);
  }

  /**
   * Cancel order (customer or admin)
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        notes: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single();

    if (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }

    return this.mapToOrder(data);
  }

  /**
   * Verify payment (Staff only)
   */
  async verifyPayment(orderId: string, verifiedBy: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'verified',
        payment_verified_at: new Date().toISOString(),
        verified_by: verifiedBy,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single();

    if (error) {
      throw new Error(`Failed to verify payment: ${error.message}`);
    }

    return this.mapToOrder(data);
  }

  /**
   * Get all orders (Staff/Admin)
   */
  async getAllOrders(filters?: {
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<Order[]> {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return this.mapToOrders(data);
  }

  // Private helpers

  private mapToOrder(data: any): Order {
    return {
      id: data.id,
      orderNumber: data.order_number,
      userId: data.user_id,
      items: data.order_items?.map((item: any) => this.mapToOrderItem(item)) || [],
      subtotal: data.subtotal,
      deliveryFee: data.delivery_fee,
      couponDiscount: data.coupon_discount,
      couponId: data.coupon_id,
      couponCode: data.coupon_code,
      total: data.total,
      isReservation: data.is_reservation,
      reservationFee: data.reservation_fee,
      reservationPercentage: data.reservation_percentage,
      status: data.status,
      fulfillment: data.fulfillment,
      pickupDetails: data.pickup_details,
      shippingAddress: data.shipping_address,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      paymentProof: data.payment_proof,
      paymentDetails: data.payment_details,
      paymentVerifiedAt: data.payment_verified_at,
      verifiedBy: data.verified_by,
      isManualOrder: data.is_manual_order,
      createdBy: data.created_by,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToOrderItem(data: any): OrderItem {
    return {
      id: data.id,
      productId: data.product_id,
      variantId: data.variant_id,
      name: data.name,
      price: data.price,
      quantity: data.quantity,
      color: data.color,
      size: data.size,
      imageUrl: data.image_url,
      warehouseSource: data.warehouse_source,
      refundRequested: data.refund_requested,
      refundReason: data.refund_reason,
      refundStatus: data.refund_status,
      refundProof: data.refund_proof,
    };
  }

  private mapToOrders(data: any[]): Order[] {
    return data.map(item => this.mapToOrder(item));
  }
}

// Export singleton instance
export const orderService = new OrderService();
