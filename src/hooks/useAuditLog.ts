// Custom hook for easy audit logging integration
import { useAuth } from "../contexts/AuthContext";
import { addAuditLog, type AuditActionType } from "../lib/auditLog";

export function useAuditLog() {
  const { user: currentUser } = useAuth();

  // Log a product action
  const logProductAction = (
    actionType: AuditActionType,
    productId: string,
    productName: string,
    changes?: { field: string; oldValue: string; newValue: string }[],
    metadata?: { productSku?: string; notes?: string }
  ) => {
    if (!currentUser) return;

    addAuditLog({
      actionType,
      performedBy: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
      },
      targetEntity: {
        type: "product",
        id: productId,
        name: productName,
      },
      changes,
      metadata,
    });
  };

  // Log an inventory action
  const logInventoryAction = (
    actionType: AuditActionType,
    productId: string,
    productName: string,
    warehouse: "lorenzo" | "oroquieta",
    changes?: { field: string; oldValue: string; newValue: string }[],
    metadata?: { productSku?: string; notes?: string }
  ) => {
    if (!currentUser) return;

    addAuditLog({
      actionType,
      performedBy: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
      },
      targetEntity: {
        type: "inventory",
        id: productId,
        name: productName,
      },
      changes,
      metadata: {
        ...metadata,
        warehouse,
      },
    });
  };

  // Log an order action
  const logOrderAction = (
    actionType: AuditActionType,
    orderId: string,
    orderNumber: string,
    changes?: { field: string; oldValue: string; newValue: string }[],
    metadata?: { notes?: string }
  ) => {
    if (!currentUser) return;

    addAuditLog({
      actionType,
      performedBy: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
      },
      targetEntity: {
        type: "order",
        id: orderId,
        name: orderNumber,
      },
      changes,
      metadata: {
        ...metadata,
        orderNumber,
      },
    });
  };

  // Log an account action
  const logAccountAction = (
    actionType: AuditActionType,
    userId: string,
    userEmail: string,
    changes?: { field: string; oldValue: string; newValue: string }[],
    metadata?: { notes?: string }
  ) => {
    if (!currentUser) return;

    addAuditLog({
      actionType,
      performedBy: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
      },
      targetEntity: {
        type: "user",
        id: userId,
        name: userEmail,
      },
      changes,
      metadata,
    });
  };

  // Log a coupon action
  const logCouponAction = (
    actionType: AuditActionType,
    couponId: string,
    couponCode: string,
    changes?: { field: string; oldValue: string; newValue: string }[],
    metadata?: { notes?: string }
  ) => {
    if (!currentUser) return;

    addAuditLog({
      actionType,
      performedBy: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
      },
      targetEntity: {
        type: "coupon",
        id: couponId,
        name: couponCode,
      },
      changes,
      metadata: {
        ...metadata,
        couponCode,
      },
    });
  };

  // Log a refund action
  const logRefundAction = (
    actionType: AuditActionType,
    orderId: string,
    orderNumber: string,
    changes?: { field: string; oldValue: string; newValue: string }[],
    metadata?: { notes?: string }
  ) => {
    if (!currentUser) return;

    addAuditLog({
      actionType,
      performedBy: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
      },
      targetEntity: {
        type: "refund",
        id: orderId,
        name: orderNumber,
      },
      changes,
      metadata: {
        ...metadata,
        orderNumber,
      },
    });
  };

  // Generic log action for attributes/taxonomy management
  const logAction = (
    action: string,
    details: string,
    userId: string,
    userName: string
  ) => {
    if (!currentUser) return;

    addAuditLog({
      actionType: action as AuditActionType,
      performedBy: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
      },
      targetEntity: {
        type: "product",
        id: userId,
        name: details,
      },
      metadata: {
        notes: details,
      },
    });
  };

  return {
    logProductAction,
    logInventoryAction,
    logOrderAction,
    logAccountAction,
    logCouponAction,
    logRefundAction,
    logAction,
  };
}