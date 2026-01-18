'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { addAuditLog } from '../lib/auditLog';
import { unreserveStock, deductStock, restoreStock, reserveStock } from '../lib/inventory';
import { returnCoupon } from '../lib/coupons';

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
  role: 'customer' | 'staff' | 'inventory-clerk' | 'admin' | 'owner';
  phone?: string;
  addresses: Address[];
  createdAt: string;
  active?: boolean; // For soft delete
}

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  
  // VARIANT SYSTEM - New way to track product variations
  variantId?: string; // ID of the specific variant ordered (e.g., "large-walnut")
  
  // LEGACY - Old way (kept for backward compatibility)
  color: string; // Color of the ordered item
  size?: string; // Optional size for products with size variants
  
  imageUrl: string;
  warehouseSource?: 'Lorenzo' | 'Oroquieta'; // Track which warehouse the item is from (for manual orders)
  refundRequested?: boolean;
  refundReason?: string;
  refundStatus?: 'pending' | 'approved' | 'rejected';
  refundProof?: string; // Customer's proof/evidence for refund request
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee?: number; // For manual orders with delivery option
  isReservation?: boolean; // Flag to indicate this is a reservation order
  reservationFee?: number; // Reservation fee paid upfront
  reservationPercentage?: number; // Percentage of total paid as reservation (e.g., 30 for 30%)
  couponCode?: string; // Applied coupon code
  couponDiscount?: number; // Discount amount from coupon
  couponId?: string; // Coupon ID for tracking usage
  total: number;
  status: 'pending' | 'reserved' | 'processing' | 'ready-for-pickup' | 'cancelled' | 'completed' | 'refund-requested' | 'refunded';
  canceledBy?: 'customer' | 'admin'; // Track who canceled the order
  deliveryMethod: 'store-pickup' | 'customer-arranged' | 'staff-delivery'; // Added staff-delivery for manual orders
  deliveryStatus?: 'preparing' | 'out-for-delivery' | 'delivered'; // Delivery tracking status
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
    phone?: string; // Customer phone number
    streetAddress?: string; // For manual orders
    province?: string; // For manual orders
  };
  billingAddress?: { // For manual orders with separate billing address
    firstName: string;
    lastName: string;
    address: string;
    barangay: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentReference?: string; // Reference number for GCash or Bank Transfer
  paymentRecipient?: string; // GCash number or Bank account number where payment was sent
  paymentRecipientName?: string; // Name of account holder (for verification)
  paymentProof?: string; // Base64 image string for payment verification
  paymentName?: string; // Name used for payment transaction
  paymentPhone?: string; // Phone number used for payment transaction
  transactionDetails?: string; // Additional transaction details
  refundDetails?: { // Manual refund tracking for audit trail
    processedBy: string; // Admin user ID who processed the refund
    processedByName: string; // Admin name for display
    processedAt: string; // Timestamp
    refundMethod: 'gcash' | 'bank' | 'cash'; // How refund was issued
    refundAmount: number; // Amount refunded
    refundReason: string; // Reason for refund
    refundProof?: string; // Base64 image of refund receipt/proof
    adminNotes?: string; // Internal admin notes
    itemsRefunded?: number[]; // Array of productIds that were refunded (empty = full order refund)
  };
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  orders: Order[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: 'customer' | 'admin' | 'owner';
  }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isOwner: () => boolean;
  hasAdminAccess: () => boolean;
  placeOrder: (order: Omit<Order, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>, customUserId?: string) => string;
  getOrders: () => Order[];
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
  cancelOrder: (orderId: string, canceledBy: 'customer' | 'admin') => void;
  processManualRefund: (orderId: string, refundData: {
    refundMethod: 'gcash' | 'bank' | 'cash';
    refundAmount: number;
    refundReason: string;
    refundProof?: string;
    adminNotes?: string;
    itemsRefunded?: number[];
  }) => void;
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, address: Omit<Address, 'id'>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  requestItemRefund: (orderId: string, productId: number, reason: string) => void;
  approveItemRefund: (orderId: string, productId: number) => void;
  rejectItemRefund: (orderId: string, productId: number) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateEmail: (newEmail: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Seed demo admin account on first load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const adminExists = users.find((u: any) => u.email === 'admin@poybash.com');
      
      if (!adminExists) {
        const demoAdmin = {
          id: 'admin-demo',
          email: 'admin@poybash.com',
          password: 'admin123',
          firstName: 'Admin',
          lastName: 'PoyBash',
          role: 'admin',
          phone: '+63 917 123 4567',
          addresses: [],
          createdAt: new Date().toISOString(),
        };
        users.push(demoAdmin);
      }
      
      // Seed demo owner account
      const ownerExists = users.find((u: any) => u.email === 'owner@poybash.com');
      if (!ownerExists) {
        const demoOwner = {
          id: 'owner-demo',
          email: 'owner@poybash.com',
          password: 'owner123',
          firstName: 'Owner',
          lastName: 'PoyBash',
          role: 'owner',
          phone: '+63 917 123 4567',
          addresses: [],
          createdAt: new Date().toISOString(),
        };
        users.push(demoOwner);
      }
      
      // Seed demo sales staff account
      const staffExists = users.find((u: any) => u.email === 'staff@poybash.com');
      if (!staffExists) {
        const demoStaff = {
          id: 'staff-demo',
          email: 'staff@poybash.com',
          password: 'staff123',
          firstName: 'Sales',
          lastName: 'Staff',
          role: 'staff',
          phone: '+63 917 123 4568',
          addresses: [],
          createdAt: new Date().toISOString(),
        };
        users.push(demoStaff);
      }
      
      // Seed demo inventory clerk account
      const clerkExists = users.find((u: any) => u.email === 'clerk@poybash.com');
      if (!clerkExists) {
        const demoClerk = {
          id: 'clerk-demo',
          email: 'clerk@poybash.com',
          password: 'clerk123',
          firstName: 'Inventory',
          lastName: 'Clerk',
          role: 'inventory-clerk',
          phone: '+63 917 123 4569',
          addresses: [],
          createdAt: new Date().toISOString(),
        };
        users.push(demoClerk);
      }
      
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, []);

  const [user, setUser] = useState<User | null>(() => {
    // Load user from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        // Ensure addresses array exists (for backwards compatibility)
        if (!parsedUser.addresses) {
          parsedUser.addresses = [];
        }
        return parsedUser;
      }
    }
    return null;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    // Load orders from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedOrders = localStorage.getItem('orders');
      return savedOrders ? JSON.parse(savedOrders) : [];
    }
    return [];
  });

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    }
  }, [user]);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orders', JSON.stringify(orders));
    }
  }, [orders]);

  // Listen for Supabase auth state changes (email verification, etc.)
  useEffect(() => {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'USER_UPDATED' && session?.user && user) {
          // Check if email was updated
          if (session.user.email !== user.email) {
            updateEmail(session.user.email || user.email);
          }
        }
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.warn('Supabase connection not available:', error);
      // Silently fail - app will use localStorage mock data
    }
  }, [user]);

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: 'customer' | 'admin' | 'owner';
  }): Promise<boolean> => {
    // In a real app, this would call an API
    // For now, we'll store users in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if user already exists
    if (users.find((u: any) => u.email === userData.email)) {
      return false;
    }

    const newUser: User = {
      id: 'user-' + Date.now(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: userData.role || 'customer',
      addresses: [],
      createdAt: new Date().toISOString(),
    };

    // Store user credentials (in real app, password would be hashed on backend)
    users.push({
      ...newUser,
      password: userData.password, // NEVER do this in production!
    });
    localStorage.setItem('users', JSON.stringify(users));

    // Auto login after registration
    setUser(newUser);
    return true;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, this would call an API
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(
      (u: any) => u.email === email && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      // Ensure addresses array exists (for backwards compatibility)
      if (!userWithoutPassword.addresses) {
        userWithoutPassword.addresses = [];
      }
      setUser(userWithoutPassword);
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isOwner = () => {
    return user?.role === 'owner';
  };

  const hasAdminAccess = () => {
    return user?.role === 'staff' || user?.role === 'inventory-clerk' || user?.role === 'admin' || user?.role === 'owner';
  };

  const placeOrder = (orderData: Omit<Order, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>, customUserId?: string): string => {
    if (!user && !customUserId) {
      throw new Error('User must be logged in to place an order');
    }

    const newOrder: Order = {
      ...orderData,
      id: 'ORD-' + Date.now(),
      userId: customUserId || user!.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Reserve stock when order is created (for items with warehouseSource)
    const itemsWithWarehouse = newOrder.items.filter(item => item.warehouseSource);
    if (itemsWithWarehouse.length > 0) {
      reserveStock(itemsWithWarehouse.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        warehouseSource: item.warehouseSource!,
      })));
    }

    setOrders(prevOrders => [...prevOrders, newOrder]);
    return newOrder.id;
  };

  const getOrders = (): Order[] => {
    if (!user) return [];
    
    // Admins and owners can see all orders, customers only see their own
    if (user.role === 'admin' || user.role === 'owner') {
      return orders;
    }
    
    return orders.filter(order => order.userId === user.id);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    // Find the order to handle stock changes
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const itemsWithWarehouse = order.items.filter(item => item.warehouseSource);
      
      // Handle stock based on status transitions
      if (status === 'completed' && itemsWithWarehouse.length > 0) {
        // When order is completed, deduct from actual quantity and unreserve
        deductStock(itemsWithWarehouse.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          warehouseSource: item.warehouseSource!,
        })));
      } else if (status === 'cancelled' && itemsWithWarehouse.length > 0) {
        // When order is cancelled, unreserve the stock
        unreserveStock(itemsWithWarehouse.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          warehouseSource: item.warehouseSource!,
        })));
        
        // Return coupon if one was applied
        if (order.couponId) {
          returnCoupon(order.couponId);
        }
      }
    }

    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          const oldStatus = order.status;
          
          // Add audit log
          if (user) {
            addAuditLog({
              actionType: 'order_status_updated',
              performedBy: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
              },
              targetEntity: {
                type: 'order',
                id: orderId,
                name: orderId,
              },
              changes: [{
                field: 'status',
                oldValue: oldStatus,
                newValue: status,
              }],
              metadata: {
                orderNumber: orderId,
              },
            });
          }
          
          return { ...order, status, updatedAt: new Date().toISOString() };
        }
        return order;
      })
    );
  };

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          // Add audit log
          if (user) {
            addAuditLog({
              actionType: 'order_modified',
              performedBy: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
              },
              targetEntity: {
                type: 'order',
                id: orderId,
                name: orderId,
              },
              metadata: {
                orderNumber: orderId,
                notes: 'Order details updated',
              },
            });
          }
          
          return { ...order, ...updates, updatedAt: new Date().toISOString() };
        }
        return order;
      })
    );
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prevOrders =>
      prevOrders.filter(order => order.id !== orderId)
    );
  };

  const cancelOrder = (orderId: string, canceledBy: 'customer' | 'admin') => {
    // Find the order to get its items and coupon
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Unreserve stock for cancelled orders (only for manual orders with warehouse info)
      const itemsWithWarehouse = order.items.filter(item => item.warehouseSource);
      if (itemsWithWarehouse.length > 0) {
        unreserveStock(itemsWithWarehouse.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          warehouseSource: item.warehouseSource!,
        })));
      }

      // Return coupon usage if one was applied
      if (order.couponId) {
        returnCoupon(order.couponId);
      }
    }

    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          const oldStatus = order.status;
          
          // Add audit log
          if (user) {
            addAuditLog({
              actionType: 'order_cancelled',
              performedBy: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
              },
              targetEntity: {
                type: 'order',
                id: orderId,
                name: orderId,
              },
              changes: [{
                field: 'status',
                oldValue: oldStatus,
                newValue: 'cancelled',
              }],
              metadata: {
                orderNumber: orderId,
                notes: `Cancelled by ${canceledBy}`,
              },
            });
          }
          
          return { ...order, status: 'cancelled', canceledBy, updatedAt: new Date().toISOString() };
        }
        return order;
      })
    );
  };

  const processManualRefund = (orderId: string, refundData: {
    refundMethod: 'gcash' | 'bank' | 'cash';
    refundAmount: number;
    refundReason: string;
    refundProof?: string;
    adminNotes?: string;
    itemsRefunded?: number[];
  }) => {
    // Find the order to restore stock and return coupon
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Only restore stock for manual orders with warehouse info
      const hasWarehouseInfo = order.items.some(item => item.warehouseSource);
      
      if (hasWarehouseInfo) {
        // If specific items were refunded, restore stock only for those items
        if (refundData.itemsRefunded && refundData.itemsRefunded.length > 0) {
          const itemsToRestore = order.items.filter(item => 
            refundData.itemsRefunded!.includes(item.productId) && item.warehouseSource
          );
          if (itemsToRestore.length > 0) {
            restoreStock(itemsToRestore.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              warehouseSource: item.warehouseSource!,
            })));
          }
        } else {
          // Full refund - restore all items with warehouse info
          const itemsWithWarehouse = order.items.filter(item => item.warehouseSource);
          if (itemsWithWarehouse.length > 0) {
            restoreStock(itemsWithWarehouse.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              warehouseSource: item.warehouseSource!,
            })));
          }
        }
      }

      // Return coupon usage if one was applied
      if (order.couponId) {
        returnCoupon(order.couponId);
      }
    }

    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          // Add audit log
          if (user) {
            addAuditLog({
              actionType: 'refund_completed',
              performedBy: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
              },
              targetEntity: {
                type: 'refund',
                id: orderId,
                name: orderId,
              },
              changes: [{
                field: 'refundAmount',
                oldValue: '0',
                newValue: refundData.refundAmount.toString(),
              }],
              metadata: {
                orderNumber: orderId,
                notes: `${refundData.refundMethod} refund: ₱${refundData.refundAmount} - ${refundData.refundReason}`,
              },
            });
          }
          
          return {
            ...order,
            status: 'refunded' as Order['status'],
            refundDetails: {
              processedBy: user?.id || '',
              processedByName: user?.firstName + ' ' + user?.lastName || '',
              processedAt: new Date().toISOString(),
              refundMethod: refundData.refundMethod,
              refundAmount: refundData.refundAmount,
              refundReason: refundData.refundReason,
              refundProof: refundData.refundProof,
              adminNotes: refundData.adminNotes,
              itemsRefunded: refundData.itemsRefunded,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
  };

  const addAddress = (addressData: Omit<Address, 'id'>) => {
    if (!user) return;
    
    const newAddress: Address = {
      ...addressData,
      id: 'addr-' + Date.now(),
    };

    const updatedUser = {
      ...user,
      addresses: [...user.addresses, newAddress],
    };

    setUser(updatedUser);
    
    // Update in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((u: any) => 
      u.id === user.id ? { ...u, addresses: updatedUser.addresses } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const updateAddress = (id: string, addressData: Omit<Address, 'id'>) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      addresses: user.addresses.map(addr => 
        addr.id === id ? { ...addressData, id } : addr
      ),
    };

    setUser(updatedUser);
    
    // Update in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((u: any) => 
      u.id === user.id ? { ...u, addresses: updatedUser.addresses } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const deleteAddress = (id: string) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      addresses: user.addresses.filter(addr => addr.id !== id),
    };

    setUser(updatedUser);
    
    // Update in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((u: any) => 
      u.id === user.id ? { ...u, addresses: updatedUser.addresses } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const setDefaultAddress = (id: string) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      addresses: user.addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      })),
    };

    setUser(updatedUser);
    
    // Update in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((u: any) => 
      u.id === user.id ? { ...u, addresses: updatedUser.addresses } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const requestItemRefund = (orderId: string, productId: number, reason: string) => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          const item = order.items.find(i => i.productId === productId);
          
          // Add audit log
          if (user && item) {
            addAuditLog({
              actionType: 'refund_requested',
              performedBy: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
              },
              targetEntity: {
                type: 'refund',
                id: `${orderId}-${productId}`,
                name: item.name,
              },
              metadata: {
                orderNumber: orderId,
                productSku: productId.toString(),
                notes: reason,
              },
            });
          }
          
          return {
            ...order,
            status: 'refund-requested' as Order['status'],
            items: order.items.map(item =>
              item.productId === productId
                ? { ...item, refundRequested: true, refundReason: reason, refundStatus: 'pending' }
                : item
            ),
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
  };

  // Approve item refund (for Admin/Owner)
  const approveItemRefund = (orderId: string, productId: number) => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          const item = order.items.find(i => i.productId === productId);
          
          // Add audit log
          if (user && item) {
            addAuditLog({
              actionType: 'refund_approved',
              performedBy: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
              },
              targetEntity: {
                type: 'refund',
                id: `${orderId}-${productId}`,
                name: item.name,
              },
              changes: [{
                field: 'refundStatus',
                oldValue: 'pending',
                newValue: 'approved',
              }],
              metadata: {
                orderNumber: orderId,
                productSku: productId.toString(),
              },
            });
          }
          
          return {
            ...order,
            items: order.items.map(item =>
              item.productId === productId && item.refundRequested
                ? { ...item, refundStatus: 'approved' }
                : item
            ),
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
  };

  // Reject item refund (for Admin/Owner)
  const rejectItemRefund = (orderId: string, productId: number) => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          const item = order.items.find(i => i.productId === productId);
          
          // Add audit log
          if (user && item) {
            addAuditLog({
              actionType: 'refund_rejected',
              performedBy: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
              },
              targetEntity: {
                type: 'refund',
                id: `${orderId}-${productId}`,
                name: item.name,
              },
              changes: [{
                field: 'refundStatus',
                oldValue: 'pending',
                newValue: 'rejected',
              }],
              metadata: {
                orderNumber: orderId,
                productSku: productId.toString(),
              },
            });
          }
          
          return {
            ...order,
            items: order.items.map(item =>
              item.productId === productId && item.refundRequested
                ? { ...item, refundStatus: 'rejected' }
                : item
            ),
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false;

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userAccount = users.find((u: any) => u.id === user.id);

    if (!userAccount) return false;

    // Verify current password
    if (userAccount.password !== currentPassword) {
      return false;
    }

    // Update password
    const updatedUsers = users.map((u: any) => 
      u.id === user.id ? { ...u, password: newPassword } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    return true;
  };

  const updateEmail = (newEmail: string) => {
    if (!user) return;

    // Update user state
    const updatedUser = { ...user, email: newEmail };
    setUser(updatedUser);

    // Update localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((u: any) => 
      u.id === user.id ? { ...u, email: newEmail } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        orders,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
        isOwner,
        hasAdminAccess,
        placeOrder,
        getOrders,
        updateOrderStatus,
        updateOrder,
        deleteOrder,
        cancelOrder,
        processManualRefund,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        requestItemRefund,
        approveItemRefund,
        rejectItemRefund,
        changePassword,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}