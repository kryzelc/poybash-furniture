"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
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
  hasAdminAccess: () => boolean;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isOwner: () => boolean;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: "customer" | "admin" | "owner";
  }) => Promise<{ success: boolean; error?: string }>;
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

// LocalStorage keys
const STORAGE_KEYS = {
  USERS: "poybash_users",
  CURRENT_SESSION: "poybash_session",
  ORDERS: "poybash_orders",
};

// Helper: Generate unique ID
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper: Hash password (simple implementation - in production use bcrypt)
const hashPassword = (password: string): string => {
  // Simple hash for demo - NOT secure for production
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

// Helper: Get all users from localStorage
const getAllUsersFromStorage = (): Array<
  User & { passwordHash: string }
> => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  return stored ? JSON.parse(stored) : [];
};

// Helper: Save users to localStorage
const saveUsersToStorage = (users: Array<User & { passwordHash: string }>) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

// Helper: Get all orders from localStorage
const getAllOrdersFromStorage = (): Order[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
  return stored ? JSON.parse(stored) : [];
};

// Helper: Save orders to localStorage
const saveOrdersToStorage = (orders: Order[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    loadUserSession();
  }, []);

  const loadUserSession = () => {
    try {
      if (typeof window === "undefined") return;

      const sessionData = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (sessionData) {
        const { userId } = JSON.parse(sessionData);
        loadUserData(userId);
      }
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = (userId: string) => {
    try {
      const users = getAllUsersFromStorage();
      const userData = users.find((u) => u.id === userId);

      if (userData) {
        const { passwordHash, ...userWithoutPassword } = userData;
        setUser(userWithoutPassword);
        loadUserOrders(userId);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadUserOrders = (userId: string) => {
    try {
      const allOrders = getAllOrdersFromStorage();
      const userOrders = allOrders.filter((order) => order.userId === userId);
      setOrders(userOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: "customer" | "admin" | "owner";
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const users = getAllUsersFromStorage();

      // Check if email already exists
      if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
        return {
          success: false,
          error: "An account with this email already exists.",
        };
      }

      // Create new user
      const newUser: User & { passwordHash: string } = {
        id: generateId(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role || "customer",
        addresses: [],
        createdAt: new Date().toISOString(),
        active: true,
        passwordHash: hashPassword(userData.password),
      };

      users.push(newUser);
      saveUsersToStorage(users);

      // Create session
      const { passwordHash, ...userWithoutPassword } = newUser;
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_SESSION,
        JSON.stringify({ userId: newUser.id }),
      );
      setUser(userWithoutPassword);
      setOrders([]);

      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const users = getAllUsersFromStorage();
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        console.error("Login error: User not found");
        return false;
      }

      // Check if account is active
      if (user.active === false) {
        console.error("Login error: Account is deactivated");
        return false;
      }

      // Verify password
      const passwordHash = hashPassword(password);
      if (user.passwordHash !== passwordHash) {
        console.error("Login error: Invalid password");
        return false;
      }

      // Create session
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_SESSION,
        JSON.stringify({ userId: user.id }),
      );

      const { passwordHash: _, ...userWithoutPassword } = user;
      setUser(userWithoutPassword);
      loadUserOrders(user.id);

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
      setUser(null);
      setOrders([]);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const placeOrder = async (orderData: any): Promise<string | null> => {
    if (!user) return null;

    try {
      const orderId = generateId();
      const orderNumber = `ORD-${Date.now()}`;

      // Reserve stock for all items
      const stockReservation = reserveStock(
        orderData.items.map((item: OrderItem) => ({
          productId: item.productId,
          variantId:
            item.variantId ||
            `one-size-${item.color.toLowerCase().replace(/\s+/g, "-")}`,
          quantity: item.quantity,
          warehouseSource: item.warehouseSource || "Lorenzo",
        })),
      );

      if (!stockReservation.success) {
        throw new Error(stockReservation.errors.join(", "));
      }

      const newOrder: Order = {
        id: orderId,
        userId: user.id,
        items: orderData.items,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        isReservation: orderData.isReservation || false,
        reservationFee: orderData.reservationFee,
        reservationPercentage: orderData.reservationPercentage,
        couponCode: orderData.couponCode,
        couponDiscount: orderData.couponDiscount,
        couponId: orderData.couponId,
        total: orderData.total,
        status: orderData.isReservation ? "reserved" : "pending",
        deliveryMethod: orderData.deliveryMethod,
        shippingAddress: orderData.shippingAddress,
        pickupDetails: orderData.pickupDetails,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save order
      const allOrders = getAllOrdersFromStorage();
      allOrders.push(newOrder);
      saveOrdersToStorage(allOrders);

      // Update local state
      setOrders([newOrder, ...orders]);

      // Add audit log
      await addAuditLog({
        actionType: "order_created",
        performedBy: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: `${user.firstName} ${user.lastName}`,
        },
        targetEntity: {
          type: "order",
          id: orderId,
          name: orderNumber,
        },
        metadata: {
          orderNumber: orderNumber,
          total: orderData.total,
          notes: `Order placed with ${orderData.items.length} items`,
        },
      });

      return orderId;
    } catch (error) {
      console.error("Place order error:", error);
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
      const allOrders = getAllOrdersFromStorage();
      const updatedOrders = allOrders.map((o) =>
        o.id === orderId
          ? {
            ...o,
            status: "cancelled" as const,
            canceledBy,
            updatedAt: new Date().toISOString(),
          }
          : o,
      );
      saveOrdersToStorage(updatedOrders);

      // Unreserve stock
      unreserveStock(
        order.items.map((item) => ({
          productId: item.productId,
          variantId:
            item.variantId ||
            `one-size-${item.color.toLowerCase().replace(/\s+/g, "-")}`,
          quantity: item.quantity,
          warehouseSource: item.warehouseSource || "Lorenzo",
        })),
      );

      // Return coupon if used
      if (order.couponId) {
        await returnCoupon(order.couponId);
      }

      // Reload orders
      if (user) loadUserOrders(user.id);

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
      const allOrders = getAllOrdersFromStorage();
      const updatedOrders = allOrders.map((o) =>
        o.id === orderId
          ? {
            ...o,
            status,
            deliveryStatus,
            updatedAt: new Date().toISOString(),
            completedAt:
              status === "completed" ? new Date().toISOString() : o.completedAt,
          }
          : o,
      );
      saveOrdersToStorage(updatedOrders);

      if (user) loadUserOrders(user.id);
      return true;
    } catch (error) {
      console.error("Update order status error:", error);
      return false;
    }
  };

  const addAddress = async (address: Omit<Address, "id">): Promise<boolean> => {
    if (!user) return false;

    try {
      const newAddress: Address = {
        ...address,
        id: generateId(),
      };

      const users = getAllUsersFromStorage();
      const updatedUsers = users.map((u) =>
        u.id === user.id
          ? { ...u, addresses: [...u.addresses, newAddress] }
          : u,
      );
      saveUsersToStorage(updatedUsers);

      loadUserData(user.id);
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
    if (!user) return false;

    try {
      const users = getAllUsersFromStorage();
      const updatedUsers = users.map((u) =>
        u.id === user.id
          ? {
            ...u,
            addresses: u.addresses.map((addr) =>
              addr.id === addressId ? { ...addr, ...updates } : addr,
            ),
          }
          : u,
      );
      saveUsersToStorage(updatedUsers);

      loadUserData(user.id);
      return true;
    } catch (error) {
      console.error("Update address error:", error);
      return false;
    }
  };

  const deleteAddress = async (addressId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const users = getAllUsersFromStorage();
      const updatedUsers = users.map((u) =>
        u.id === user.id
          ? {
            ...u,
            addresses: u.addresses.filter((addr) => addr.id !== addressId),
          }
          : u,
      );
      saveUsersToStorage(updatedUsers);

      loadUserData(user.id);
      return true;
    } catch (error) {
      console.error("Delete address error:", error);
      return false;
    }
  };

  const setDefaultAddress = async (addressId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const users = getAllUsersFromStorage();
      const updatedUsers = users.map((u) =>
        u.id === user.id
          ? {
            ...u,
            addresses: u.addresses.map((addr) => ({
              ...addr,
              isDefault: addr.id === addressId,
            })),
          }
          : u,
      );
      saveUsersToStorage(updatedUsers);

      loadUserData(user.id);
      return true;
    } catch (error) {
      console.error("Set default address error:", error);
      return false;
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      const users = getAllUsersFromStorage();
      const updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, ...updates } : u,
      );
      saveUsersToStorage(updatedUsers);

      loadUserData(user.id);
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

  const hasAdminAccess = () => {
    return user?.role === "admin" || user?.role === "owner" || user?.role === "staff" || user?.role === "inventory-clerk";
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const isOwner = () => {
    return user?.role === "owner";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        orders,
        loading,
        hasAdminAccess,
        isAuthenticated,
        isAdmin,
        isOwner,
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
