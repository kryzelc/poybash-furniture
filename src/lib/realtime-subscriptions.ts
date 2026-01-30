// ============================================
// Real-Time Subscriptions - Client Examples
// ============================================
// Copy these patterns into your React components

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ============================================
// 1. ORDER STATUS UPDATES (Customer View)
// ============================================

export function useOrderStatusSubscription(orderId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log("Order updated:", payload.new);

          // Show toast notification
          const newStatus = payload.new.status;
          const statusMessages = {
            confirmed: "Your order has been confirmed! ✅",
            processing: "Your order is now being processed 📦",
            ready: "Your order is ready for pickup/delivery! 🎉",
            completed: "Order completed. Thank you! 🙏",
            cancelled: "Your order has been cancelled ❌",
          };

          // Your toast/notification logic here
          alert(statusMessages[newStatus as keyof typeof statusMessages]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);
}

// Usage in component:
// const { order } = useOrder()
// useOrderStatusSubscription(order.id)

// ============================================
// 2. REAL-TIME NOTIFICATIONS (All Users)
// ============================================

export function useNotifications(userId: string) {
  useEffect(() => {
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("New notification:", payload.new);

          // Show notification badge
          // Play sound
          // Show toast
          const notification = payload.new;

          // Your notification UI logic here
          showNotification({
            type: notification.type,
            message: notification.message,
            timestamp: notification.created_at,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}

// ============================================
// 3. INVENTORY UPDATES (Staff Dashboard)
// ============================================

export function useInventoryUpdates() {
  useEffect(() => {
    const channel = supabase
      .channel("inventory-updates")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all changes
          schema: "public",
          table: "warehouse_stock",
        },
        (payload) => {
          console.log("Inventory changed:", payload);

          if (payload.eventType === "UPDATE") {
            const { quantity, reserved } = payload.new;
            const available = quantity - reserved;

            // Refresh inventory table
            // Show low stock warning if needed
            if (available <= 10) {
              showLowStockAlert(payload.new);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

// ============================================
// 4. NEW ORDERS (Staff Dashboard)
// ============================================

export function useNewOrderAlerts() {
  useEffect(() => {
    const channel = supabase
      .channel("new-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("New order received:", payload.new);

          // Play notification sound
          playSound("/notification.mp3");

          // Show alert
          showToast({
            title: "New Order!",
            message: `Order ${payload.new.order_number} - ₱${payload.new.total}`,
            type: "success",
            duration: 5000,
          });

          // Refresh orders list
          refreshOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

// ============================================
// 5. PAYMENT VERIFICATION UPDATES (Customer)
// ============================================

export function usePaymentStatusSubscription(orderId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`payment:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const oldStatus = payload.old.payment_status;
          const newStatus = payload.new.payment_status;

          if (oldStatus !== newStatus) {
            if (newStatus === "verified") {
              showToast({
                title: "Payment Verified! ✅",
                message:
                  "Your payment has been confirmed. Order is being processed.",
                type: "success",
              });
            } else if (newStatus === "rejected") {
              showToast({
                title: "Payment Rejected ❌",
                message: "Please check your payment proof and resubmit.",
                type: "error",
              });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);
}

// ============================================
// 6. PRODUCT AVAILABILITY (Product Page)
// ============================================

export function useProductAvailability(productId: number) {
  useEffect(() => {
    const channel = supabase
      .channel(`product:${productId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `id=eq.${productId}`,
        },
        (payload) => {
          if (payload.new.in_stock !== payload.old.in_stock) {
            if (!payload.new.in_stock) {
              showToast({
                title: "Product Out of Stock",
                message: "This item is no longer available.",
                type: "warning",
              });
            } else {
              showToast({
                title: "Back in Stock! 🎉",
                message: "This item is available again.",
                type: "success",
              });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);
}

// ============================================
// 7. ADMIN AUDIT LOG STREAM (Owner Dashboard)
// ============================================

export function useAuditLogStream() {
  useEffect(() => {
    const channel = supabase
      .channel("audit-logs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "audit_logs",
        },
        (payload) => {
          const log = payload.new;

          // Only show critical events
          const criticalActions = [
            "ROLE_CHANGE",
            "ACCOUNT_DISABLE",
            "VERIFY_PAYMENT",
            "APPROVE_REFUND",
          ];

          if (criticalActions.includes(log.action_type)) {
            addToActivityFeed({
              action: log.action_type,
              user: log.performer_info?.email,
              timestamp: log.timestamp,
              entity: log.entity_name,
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

// ============================================
// 8. PRESENCE: Online Users (Staff Chat/Support)
// ============================================

export function usePresence(userId: string, userRole: string) {
  useEffect(() => {
    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const onlineUsers = Object.keys(state).map((key) => state[key][0]);
        console.log("Online users:", onlineUsers);
        updateOnlineUsersList(onlineUsers);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        console.log("User joined:", newPresences);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        console.log("User left:", leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            role: userRole,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userRole]);
}

// ============================================
// HELPER FUNCTIONS (Implement in your app)
// ============================================

function showNotification(notification: any) {
  // Your toast/notification library
  console.log("Notification:", notification);
}

function showToast(options: any) {
  // Your toast library (react-hot-toast, sonner, etc.)
  console.log("Toast:", options);
}

function showLowStockAlert(stockData: any) {
  console.log("Low stock alert:", stockData);
}

function playSound(url: string) {
  const audio = new Audio(url);
  audio.play().catch(console.error);
}

function refreshOrders() {
  // Refresh your orders query
  console.log("Refreshing orders...");
}

function addToActivityFeed(activity: any) {
  // Add to your activity feed UI
  console.log("Activity:", activity);
}

function updateOnlineUsersList(users: any[]) {
  // Update online users in UI
  console.log("Online users:", users);
}

// ============================================
// USAGE IN COMPONENTS
// ============================================

/*
// In your order confirmation page:
import { useOrderStatusSubscription } from '@/lib/subscriptions'

export default function OrderConfirmation({ orderId }) {
  useOrderStatusSubscription(orderId)
  
  return <div>Your order is being processed...</div>
}

// In your staff dashboard:
import { useNewOrderAlerts, useInventoryUpdates } from '@/lib/subscriptions'

export default function StaffDashboard() {
  useNewOrderAlerts()
  useInventoryUpdates()
  
  return <div>Dashboard content...</div>
}

// In your app layout (for all authenticated users):
import { useNotifications } from '@/lib/subscriptions'

export default function AppLayout({ children }) {
  const { user } = useAuth()
  useNotifications(user.id)
  
  return <div>{children}</div>
}
*/
