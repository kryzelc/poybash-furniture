"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { supabase } from "../utils/supabase/client";
import { addAuditLog } from "../lib/auditLog";
import {
  unreserveStock,
  deductStock,
  restoreStock,
  reserveStock,
} from "../lib/inventory";
import { returnCoupon } from "../lib/coupons";

export interface Address {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  address: string;
  barangay: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "customer" | "staff" | "inventory-clerk" | "admin" | "owner";
  phone?: string;
  addresses: Address[];
  createdAt: string;
  active?: boolean;
}

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  variantId?: string;
  color: string;
  size?: string;
  imageUrl: string;
  warehouseSource?: "Lorenzo" | "Oroquieta";
  refundRequested?: boolean;
  refundReason?: string;
  refundStatus?: "pending" | "approved" | "rejected";
  refundProof?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee?: number;
  isReservation?: boolean;
  reservationFee?: number;
  reservationPercentage?: number;
  couponCode?: string;
  couponDiscount?: number;
  couponId?: string;
  total: number;
  status:
    | "pending"
    | "reserved"
    | "processing"
    | "ready-for-pickup"
    | "cancelled"
    | "completed"
    | "refund-requested"
    | "refunded";
  canceledBy?: "customer" | "admin";
  deliveryMethod: "store-pickup" | "customer-arranged" | "staff-delivery";
  deliveryStatus?: "preparing" | "out-for-delivery" | "delivered";
  pickupDetails?: {
    pickupPerson: string;
    pickupPhone: string;
    pickupDate?: string;
    deliveryService?: string;
    trackingNumber?: string;
  };
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    barangay: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: "cash" | "gcash" | "bank-transfer" | "card";
  paymentStatus: "pending" | "paid" | "failed";
  paymentProof?: string;
  paymentVerifiedAt?: string;
  verifiedBy?: string;
  isManualOrder?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
}

interface AuthContextType {
  user: User | null;
  orders: Order[];
  loading: boolean;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: "customer" | "admin" | "owner";
  }) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  placeOrder: (orderData: {
    items: OrderItem[];
    subtotal: number;
    total: number;
    deliveryMethod: "store-pickup" | "customer-arranged" | "staff-delivery";
    shippingAddress: any;
    pickupDetails?: any;
    paymentMethod: "cash" | "gcash" | "bank-transfer" | "card";
    couponCode?: string;
    couponDiscount?: number;
    couponId?: string;
    deliveryFee?: number;
    isReservation?: boolean;
    reservationFee?: number;
    reservationPercentage?: number;
  }) => Promise<string | null>;
  cancelOrder: (
    orderId: string,
    canceledBy: "customer" | "admin",
  ) => Promise<boolean>;
  requestRefund: (
    orderId: string,
    productId: number,
    reason: string,
    proof?: string,
  ) => Promise<boolean>;
  approveRefund: (orderId: string, productId: number) => Promise<boolean>;
  rejectRefund: (orderId: string, productId: number) => Promise<boolean>;
  updateOrderStatus: (
    orderId: string,
    status: Order["status"],
    deliveryStatus?: Order["deliveryStatus"],
  ) => Promise<boolean>;
  addAddress: (address: Omit<Address, "id">) => Promise<boolean>;
  updateAddress: (
    addressId: string,
    updates: Partial<Address>,
  ) => Promise<boolean>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  updateEmail: (newEmail: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    loadUserSession();
  }, []);

  const loadUserSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await loadUserData(session.user.id);
      }
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      // Load user profile from database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          `
          *,
          addresses (*)
        `,
        )
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      if (userData) {
        const formattedUser: User = {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: userData.role,
          phone: userData.phone,
          active: userData.active,
          createdAt: userData.created_at,
          addresses: (userData.addresses || []).map((addr: any) => ({
            id: addr.id,
            label: addr.label,
            firstName: addr.first_name,
            lastName: addr.last_name,
            address: addr.address,
            barangay: addr.barangay,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zip_code,
            country: addr.country,
            phone: addr.phone,
            isDefault: addr.is_default,
          })),
        };
        setUser(formattedUser);

        // Load user's orders
        await loadUserOrders(userId);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadUserOrders = async (userId: string) => {
    try {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (*)
        `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform database orders to app format
      const formattedOrders: Order[] = (ordersData || []).map((order: any) => ({
        id: order.id,
        userId: order.user_id,
        items: (order.order_items || []).map((item: any) => ({
          productId: item.product_id,
          name: item.product_name,
          price: parseFloat(item.price_at_time),
          quantity: item.quantity,
          variantId: item.variant_id,
          color: item.color || "",
          size: item.size,
          imageUrl: item.image_url || "",
          warehouseSource: item.warehouse_source,
        })),
        subtotal: parseFloat(order.subtotal),
        deliveryFee: order.delivery_fee
          ? parseFloat(order.delivery_fee)
          : undefined,
        isReservation: order.is_reservation,
        reservationFee: order.reservation_fee
          ? parseFloat(order.reservation_fee)
          : undefined,
        reservationPercentage: order.reservation_percentage,
        couponDiscount: order.coupon_discount
          ? parseFloat(order.coupon_discount)
          : undefined,
        total: parseFloat(order.total),
        status: order.status,
        deliveryMethod:
          order.fulfillment === "pickup" ? "store-pickup" : "customer-arranged",
        pickupDetails: order.pickup_details,
        shippingAddress: order.shipping_address || {},
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        paymentProof: order.payment_proof,
        isManualOrder: order.is_manual_order,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        completedAt: order.completed_at,
        notes: order.notes,
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  // Listen for Supabase auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await loadUserData(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setOrders([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: "customer" | "admin" | "owner";
  }): Promise<boolean> => {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) {
        console.error("Registration error:", authError);
        return false;
      }

      if (!authData.user) return false;

      // Create user profile in database
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        role: userData.role || "customer",
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        return false;
      }

      // Load the new user data
      await loadUserData(authData.user.id);

      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        return false;
      }

      if (data.user) {
        await loadUserData(data.user.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setOrders([]);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const placeOrder = async (orderData: any): Promise<string | null> => {
    if (!user) return null;

    try {
      // Reserve stock for all items
      for (const item of orderData.items) {
        await reserveStock(
          item.productId,
          item.variantId ||
            `one-size-${item.color.toLowerCase().replace(/\s+/g, "-")}`,
          item.quantity,
          item.warehouseSource || "Lorenzo",
        );
      }

      // Create order in database
      const { data: orderRecord, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: `ORD-${Date.now()}`,
          status: orderData.isReservation ? "reserved" : "pending",
          subtotal: orderData.subtotal,
          delivery_fee: orderData.deliveryFee || 0,
          coupon_discount: orderData.couponDiscount || 0,
          coupon_id: orderData.couponId,
          total: orderData.total,
          is_reservation: orderData.isReservation || false,
          reservation_fee: orderData.reservationFee,
          reservation_percentage: orderData.reservationPercentage,
          fulfillment:
            orderData.deliveryMethod === "store-pickup" ? "pickup" : "delivery",
          pickup_details: orderData.pickupDetails,
          shipping_address: orderData.shippingAddress,
          payment_method: orderData.paymentMethod,
          payment_status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map((item: OrderItem) => ({
        order_id: orderRecord.id,
        product_id: item.productId,
        variant_id: item.variantId,
        product_name: item.name,
        quantity: item.quantity,
        price_at_time: item.price,
        color: item.color,
        size: item.size,
        image_url: item.imageUrl,
        warehouse_source: item.warehouseSource,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Reload orders
      await loadUserOrders(user.id);

      // Add audit log
      await addAuditLog({
        userId: user.id,
        action: "ORDER_PLACED",
        entityType: "order",
        entityId: orderRecord.id,
        details: `Order placed with ${orderData.items.length} items`,
      });

      return orderRecord.id;
    } catch (error) {
      console.error("Place order error:", error);

      // Unreserve stock on error
      for (const item of orderData.items) {
        await unreserveStock(
          item.productId,
          item.variantId ||
            `one-size-${item.color.toLowerCase().replace(/\s+/g, "-")}`,
          item.quantity,
          item.warehouseSource || "Lorenzo",
        );
      }

      return null;
    }
  };

  const cancelOrder = async (
    orderId: string,
    canceledBy: "customer" | "admin",
  ): Promise<boolean> => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return false;

      // Update order status
      const { error } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      // Unreserve stock
      for (const item of order.items) {
        await unreserveStock(
          item.productId,
          item.variantId ||
            `one-size-${item.color.toLowerCase().replace(/\s+/g, "-")}`,
          item.quantity,
          item.warehouseSource || "Lorenzo",
        );
      }

      // Return coupon if used
      if (order.couponId) {
        await returnCoupon(order.couponId);
      }

      // Reload orders
      if (user) await loadUserOrders(user.id);

      return true;
    } catch (error) {
      console.error("Cancel order error:", error);
      return false;
    }
  };

  const requestRefund = async (
    orderId: string,
    productId: number,
    reason: string,
    proof?: string,
  ): Promise<boolean> => {
    // Refund logic - will implement based on your needs
    return true;
  };

  const approveRefund = async (
    orderId: string,
    productId: number,
  ): Promise<boolean> => {
    // Approve refund logic
    return true;
  };

  const rejectRefund = async (
    orderId: string,
    productId: number,
  ): Promise<boolean> => {
    // Reject refund logic
    return true;
  };

  const updateOrderStatus = async (
    orderId: string,
    status: Order["status"],
    deliveryStatus?: Order["deliveryStatus"],
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status,
          updated_at: new Date().toISOString(),
          completed_at:
            status === "completed" ? new Date().toISOString() : undefined,
        })
        .eq("id", orderId);

      if (error) throw error;

      if (user) await loadUserOrders(user.id);
      return true;
    } catch (error) {
      console.error("Update order status error:", error);
      return false;
    }
  };

  const addAddress = async (address: Omit<Address, "id">): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.from("addresses").insert({
        user_id: user.id,
        label: address.label,
        first_name: address.firstName,
        last_name: address.lastName,
        address: address.address,
        barangay: address.barangay,
        city: address.city,
        state: address.state,
        zip_code: address.zipCode,
        country: address.country,
        phone: address.phone,
        is_default: address.isDefault,
      });

      if (error) throw error;

      await loadUserData(user.id);
      return true;
    } catch (error) {
      console.error("Add address error:", error);
      return false;
    }
  };

  const updateAddress = async (
    addressId: string,
    updates: Partial<Address>,
  ): Promise<boolean> => {
    try {
      const dbUpdates: any = {};
      if (updates.label !== undefined) dbUpdates.label = updates.label;
      if (updates.firstName !== undefined)
        dbUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined)
        dbUpdates.last_name = updates.lastName;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.barangay !== undefined) dbUpdates.barangay = updates.barangay;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.state !== undefined) dbUpdates.state = updates.state;
      if (updates.zipCode !== undefined) dbUpdates.zip_code = updates.zipCode;
      if (updates.country !== undefined) dbUpdates.country = updates.country;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.isDefault !== undefined)
        dbUpdates.is_default = updates.isDefault;

      const { error } = await supabase
        .from("addresses")
        .update(dbUpdates)
        .eq("id", addressId);

      if (error) throw error;

      if (user) await loadUserData(user.id);
      return true;
    } catch (error) {
      console.error("Update address error:", error);
      return false;
    }
  };

  const deleteAddress = async (addressId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId);

      if (error) throw error;

      if (user) await loadUserData(user.id);
      return true;
    } catch (error) {
      console.error("Delete address error:", error);
      return false;
    }
  };

  const setDefaultAddress = async (addressId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Unset all default addresses
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Set the new default
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", addressId);

      if (error) throw error;

      await loadUserData(user.id);
      return true;
    } catch (error) {
      console.error("Set default address error:", error);
      return false;
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      const dbUpdates: any = {};
      if (updates.firstName !== undefined)
        dbUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined)
        dbUpdates.last_name = updates.lastName;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;

      const { error } = await supabase
        .from("users")
        .update(dbUpdates)
        .eq("id", user.id);

      if (error) throw error;

      await loadUserData(user.id);
      return true;
    } catch (error) {
      console.error("Update profile error:", error);
      return false;
    }
  };

  const updateEmail = (newEmail: string) => {
    if (user) {
      setUser({ ...user, email: newEmail });
    }
  };

  const value = {
    user,
    orders,
    loading,
    register,
    login,
    logout,
    placeOrder,
    cancelOrder,
    requestRefund,
    approveRefund,
    rejectRefund,
    updateOrderStatus,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    updateProfile,
    updateEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
