// Comprehensive Audit Log System for PoyBash Furniture
// Tracks ALL changes across the entire application

export type AuditActionType =
  // Account Management
  | "account_created"
  | "account_modified"
  | "role_changed"
  | "account_deactivated"
  | "account_reactivated"
  // Product Management
  | "product_created"
  | "product_modified"
  | "product_deleted"
  | "product_reactivated"
  | "product_image_updated"
  // Inventory Management
  | "inventory_updated"
  | "stock_added"
  | "stock_removed"
  | "stock_transferred"
  | "low_stock_alert"
  // Order Management
  | "order_created"
  | "order_status_updated"
  | "order_modified"
  | "order_cancelled"
  | "manual_order_created"
  // Coupon Management
  | "coupon_created"
  | "coupon_modified"
  | "coupon_activated"
  | "coupon_deactivated"
  | "coupon_deleted"
  // Refund Management
  | "refund_requested"
  | "refund_approved"
  | "refund_rejected"
  | "refund_completed"
  // Taxonomy Management
  | "taxonomy_created"
  | "taxonomy_modified"
  | "taxonomy_deleted";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionType: AuditActionType;
  performedBy: {
    id: string;
    email: string;
    role: string;
    name?: string; // firstName + lastName
  };
  targetEntity: {
    type: "user" | "product" | "order" | "inventory" | "coupon" | "refund" | "taxonomy";
    id: string;
    name: string; // user email, product name, order number, etc.
  };
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  metadata?: {
    warehouse?: "lorenzo" | "oroquieta";
    orderNumber?: string;
    productSku?: string;
    couponCode?: string;
    notes?: string;
  };
  ipAddress?: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
}

export interface UserNotification {
  id: string;
  userId: string;
  timestamp: string;
  type: "account_modified" | "role_changed" | "account_status" | "order_update" | "refund_update";
  message: string;
  read: boolean;
  details?: string;
}

// Get all audit logs
export function getAuditLogs(): AuditLogEntry[] {
  if (typeof window === "undefined") return [];
  const logs = localStorage.getItem("auditLogs");
  return logs ? JSON.parse(logs) : [];
}

// Helper: Get device and browser info
function getDeviceInfo() {
  if (typeof window === "undefined") return undefined;
  
  const userAgent = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  // Detect browser
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";
  else if (userAgent.includes("Opera")) browser = "Opera";

  // Detect OS
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS")) os = "iOS";

  // Detect device type
  if (/Mobile|Android|iPhone|iPad|iPod/.test(userAgent)) device = "Mobile";
  else if (/Tablet|iPad/.test(userAgent)) device = "Tablet";

  return { browser, os, device };
}

// Helper: Get simulated IP address (in real app, this would come from server)
function getIPAddress(): string {
  // In a real application, this would be obtained from the server
  // For now, we'll generate a simulated local IP
  return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// Add audit log entry
export function addAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp">): void {
  const logs = getAuditLogs();
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ipAddress: getIPAddress(),
    deviceInfo: getDeviceInfo(),
  };
  logs.unshift(newEntry); // Add to beginning for recent-first order
  
  // Keep only last 2000 entries to prevent excessive storage
  if (logs.length > 2000) {
    logs.splice(2000);
  }
  
  localStorage.setItem("auditLogs", JSON.stringify(logs));
}

// Get audit logs for specific user (who performed the action)
export function getAuditLogsByUser(userId: string): AuditLogEntry[] {
  const logs = getAuditLogs();
  return logs.filter(log => log.performedBy.id === userId);
}

// Get audit logs for specific entity (what was changed)
export function getAuditLogsByEntity(entityType: string, entityId: string): AuditLogEntry[] {
  const logs = getAuditLogs();
  return logs.filter(log => log.targetEntity.type === entityType && log.targetEntity.id === entityId);
}

// Get audit logs by action type
export function getAuditLogsByActionType(actionType: AuditActionType): AuditLogEntry[] {
  const logs = getAuditLogs();
  return logs.filter(log => log.actionType === actionType);
}

// Get audit logs by date range
export function getAuditLogsByDateRange(startDate: Date, endDate: Date): AuditLogEntry[] {
  const logs = getAuditLogs();
  return logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= startDate && logDate <= endDate;
  });
}

// Get audit logs by role
export function getAuditLogsByRole(role: string): AuditLogEntry[] {
  const logs = getAuditLogs();
  return logs.filter(log => log.performedBy.role === role);
}

// Get audit logs by warehouse (for inventory)
export function getAuditLogsByWarehouse(warehouse: "lorenzo" | "oroquieta"): AuditLogEntry[] {
  const logs = getAuditLogs();
  return logs.filter(log => log.metadata?.warehouse === warehouse);
}

// Search audit logs
export function searchAuditLogs(searchTerm: string): AuditLogEntry[] {
  const logs = getAuditLogs();
  const term = searchTerm.toLowerCase();
  return logs.filter(log => {
    // Safety checks - skip malformed logs
    if (!log.performedBy || !log.targetEntity) return false;
    
    return (
      log.performedBy.email?.toLowerCase().includes(term) ||
      log.performedBy.name?.toLowerCase().includes(term) ||
      log.targetEntity.name?.toLowerCase().includes(term) ||
      log.actionType?.toLowerCase().includes(term) ||
      log.metadata?.orderNumber?.toLowerCase().includes(term) ||
      log.metadata?.productSku?.toLowerCase().includes(term) ||
      log.metadata?.couponCode?.toLowerCase().includes(term)
    );
  });
}

// Export audit logs as CSV
export function exportAuditLogsToCSV(): string {
  const logs = getAuditLogs();
  // Filter out malformed logs
  const validLogs = logs.filter(log => 
    log.performedBy && 
    log.performedBy.email && 
    log.performedBy.role && 
    log.targetEntity && 
    log.targetEntity.type &&
    log.targetEntity.name
  );
  
  const headers = [
    "Timestamp",
    "Action Type",
    "Performed By",
    "Role",
    "Entity Type",
    "Entity Name",
    "Changes",
    "Warehouse",
    "Notes"
  ];
  
  const rows = validLogs.map(log => {
    const changes = log.changes
      ? log.changes.map(c => `${c.field}: ${c.oldValue} → ${c.newValue}`).join("; ")
      : "N/A";
    
    return [
      new Date(log.timestamp).toLocaleString(),
      log.actionType,
      log.performedBy.name || log.performedBy.email,
      log.performedBy.role,
      log.targetEntity.type,
      log.targetEntity.name,
      changes,
      log.metadata?.warehouse || "N/A",
      log.metadata?.notes || "N/A",
    ].map(cell => `"${cell}"`).join(",");
  });
  
  return [headers.join(","), ...rows].join("\n");
}

// Export filtered audit logs as CSV
export function exportFilteredAuditLogsToCSV(filteredLogs: AuditLogEntry[]): string {
  // Filter out malformed logs
  const validLogs = filteredLogs.filter(log => 
    log.performedBy && 
    log.performedBy.email && 
    log.performedBy.role && 
    log.targetEntity && 
    log.targetEntity.type &&
    log.targetEntity.name
  );
  
  const headers = [
    "Timestamp",
    "Action Type",
    "Performed By",
    "Role",
    "Entity Type",
    "Entity Name",
    "Changes",
    "Warehouse",
    "Notes"
  ];
  
  const rows = validLogs.map(log => {
    const changes = log.changes
      ? log.changes.map(c => `${c.field}: ${c.oldValue} → ${c.newValue}`).join("; ")
      : "N/A";
    
    return [
      new Date(log.timestamp).toLocaleString(),
      log.actionType,
      log.performedBy.name || log.performedBy.email,
      log.performedBy.role,
      log.targetEntity.type,
      log.targetEntity.name,
      changes,
      log.metadata?.warehouse || "N/A",
      log.metadata?.notes || "N/A",
    ].map(cell => `"${cell}"`).join(",");
  });
  
  return [headers.join(","), ...rows].join("\n");
}

// Clear audit logs (Owner only - should be confirmed in UI)
export function clearAuditLogs(): void {
  localStorage.setItem("auditLogs", JSON.stringify([]));
}

// Get statistics for dashboard
export function getAuditLogStats() {
  const logs = getAuditLogs();
  // Filter out malformed logs
  const validLogs = logs.filter(log => 
    log.performedBy && 
    log.performedBy.role && 
    log.targetEntity && 
    log.targetEntity.type &&
    log.actionType
  );
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    total: validLogs.length,
    today: validLogs.filter(l => new Date(l.timestamp) >= today).length,
    thisWeek: validLogs.filter(l => new Date(l.timestamp) >= thisWeek).length,
    thisMonth: validLogs.filter(l => new Date(l.timestamp) >= thisMonth).length,
    byAction: validLogs.reduce((acc, log) => {
      acc[log.actionType] = (acc[log.actionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byRole: validLogs.reduce((acc, log) => {
      acc[log.performedBy.role] = (acc[log.performedBy.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byEntity: validLogs.reduce((acc, log) => {
      acc[log.targetEntity.type] = (acc[log.targetEntity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

// Get user notifications
export function getUserNotifications(userId: string): UserNotification[] {
  if (typeof window === "undefined") return [];
  const notifications = localStorage.getItem("userNotifications");
  const allNotifications: UserNotification[] = notifications ? JSON.parse(notifications) : [];
  return allNotifications.filter(n => n.userId === userId);
}

// Add notification for user
export function addUserNotification(notification: Omit<UserNotification, "id" | "timestamp" | "read">): void {
  const allNotifications = localStorage.getItem("userNotifications");
  const allNotifs: UserNotification[] = allNotifications ? JSON.parse(allNotifications) : [];
  
  const newNotification: UserNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  
  allNotifs.unshift(newNotification);
  
  // Keep only last 100 notifications per user
  const userNotifs = allNotifs.filter(n => n.userId === notification.userId);
  if (userNotifs.length > 100) {
    const toRemove = userNotifs.slice(100).map(n => n.id);
    const filtered = allNotifs.filter(n => !toRemove.includes(n.id));
    localStorage.setItem("userNotifications", JSON.stringify(filtered));
  } else {
    localStorage.setItem("userNotifications", JSON.stringify(allNotifs));
  }
}

// Mark notification as read
export function markNotificationAsRead(notificationId: string): void {
  const allNotifications = localStorage.getItem("userNotifications");
  if (!allNotifications) return;
  
  const notifications: UserNotification[] = JSON.parse(allNotifications);
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  
  localStorage.setItem("userNotifications", JSON.stringify(updated));
}

// Mark all notifications as read for user
export function markAllNotificationsAsRead(userId: string): void {
  const allNotifications = localStorage.getItem("userNotifications");
  if (!allNotifications) return;
  
  const notifications: UserNotification[] = JSON.parse(allNotifications);
  const updated = notifications.map(n => 
    n.userId === userId ? { ...n, read: true } : n
  );
  
  localStorage.setItem("userNotifications", JSON.stringify(updated));
}

// Get unread notification count
export function getUnreadNotificationCount(userId: string): number {
  const notifications = getUserNotifications(userId);
  return notifications.filter(n => !n.read).length;
}

// Check if email can be changed (cooldown check)
export function canChangeEmail(userId: string): { allowed: boolean; nextAllowedChange?: Date } {
  const logs = getAuditLogs();
  const emailChanges = logs.filter(
    log => 
      log.targetEntity.id === userId && 
      log.actionType === "account_modified" &&
      log.changes?.some(c => c.field === "email")
  );
  
  if (emailChanges.length === 0) return { allowed: true };
  
  const lastEmailChange = new Date(emailChanges[0].timestamp);
  const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const nextAllowedChange = new Date(lastEmailChange.getTime() + cooldownPeriod);
  const now = new Date();
  
  if (now >= nextAllowedChange) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    nextAllowedChange,
  };
}

// Helper: Get action type display name
export function getActionTypeDisplayName(actionType: AuditActionType): string {
  const names: Record<AuditActionType, string> = {
    // Account
    "account_created": "Account Created",
    "account_modified": "Account Modified",
    "role_changed": "Role Changed",
    "account_deactivated": "Account Deactivated",
    "account_reactivated": "Account Reactivated",
    // Product
    "product_created": "Product Created",
    "product_modified": "Product Modified",
    "product_deleted": "Product Deleted",
    "product_reactivated": "Product Reactivated",
    "product_image_updated": "Product Image Updated",
    // Inventory
    "inventory_updated": "Inventory Updated",
    "stock_added": "Stock Added",
    "stock_removed": "Stock Removed",
    "stock_transferred": "Stock Transferred",
    "low_stock_alert": "Low Stock Alert",
    // Order
    "order_created": "Order Created",
    "order_status_updated": "Order Status Updated",
    "order_modified": "Order Modified",
    "order_cancelled": "Order Cancelled",
    "manual_order_created": "Manual Order Created",
    // Coupon
    "coupon_created": "Coupon Created",
    "coupon_modified": "Coupon Modified",
    "coupon_activated": "Coupon Activated",
    "coupon_deactivated": "Coupon Deactivated",
    "coupon_deleted": "Coupon Deleted",
    // Refund
    "refund_requested": "Refund Requested",
    "refund_approved": "Refund Approved",
    "refund_rejected": "Refund Rejected",
    "refund_completed": "Refund Completed",
    // Taxonomy
    "taxonomy_created": "Taxonomy Created",
    "taxonomy_modified": "Taxonomy Modified",
    "taxonomy_deleted": "Taxonomy Deleted",
  };
  return names[actionType] || actionType;
}

// Helper: Get entity type display name
export function getEntityTypeDisplayName(entityType: string): string {
  const names: Record<string, string> = {
    "user": "User Account",
    "product": "Product",
    "order": "Order",
    "inventory": "Inventory",
    "coupon": "Coupon",
    "refund": "Refund",
  };
  return names[entityType] || entityType;
}

// Helper: Check if action is critical
export function isCriticalAction(actionType: AuditActionType): boolean {
  const criticalActions: AuditActionType[] = [
    "account_deactivated",
    "role_changed",
    "product_deleted",
    "order_cancelled",
    "coupon_deleted",
    "refund_approved",
    "refund_rejected",
    "stock_removed",
  ];
  return criticalActions.includes(actionType);
}

// Helper: Detect suspicious activity
export interface SuspiciousActivity {
  id: string;
  type: "rapid_changes" | "after_hours" | "bulk_deletion" | "unusual_ip";
  severity: "low" | "medium" | "high";
  description: string;
  logs: AuditLogEntry[];
  detectedAt: string;
}

export function detectSuspiciousActivities(): SuspiciousActivity[] {
  const logs = getAuditLogs();
  const suspicious: SuspiciousActivity[] = [];
  const now = new Date();

  // Detect rapid changes (5+ actions within 1 minute by same user)
  const userActions = new Map<string, AuditLogEntry[]>();
  logs.forEach(log => {
    // Safety check - skip logs with missing performedBy data
    if (!log.performedBy || !log.performedBy.id) return;
    
    const key = log.performedBy.id;
    if (!userActions.has(key)) userActions.set(key, []);
    userActions.get(key)!.push(log);
  });

  userActions.forEach((actions, userId) => {
    for (let i = 0; i < actions.length - 4; i++) {
      const timeWindow = actions.slice(i, i + 5);
      const firstTime = new Date(timeWindow[0].timestamp).getTime();
      const lastTime = new Date(timeWindow[4].timestamp).getTime();
      
      if (lastTime - firstTime <= 60000) { // Within 1 minute
        suspicious.push({
          id: `suspicious-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "rapid_changes",
          severity: "medium",
          description: `${timeWindow[0].performedBy?.name || timeWindow[0].performedBy?.email || 'Unknown user'} made 5+ actions within 1 minute`,
          logs: timeWindow,
          detectedAt: new Date().toISOString(),
        });
        break;
      }
    }
  });

  // Detect after-hours activity (before 7 AM or after 8 PM)
  const afterHoursLogs = logs.filter(log => {
    if (!log.performedBy || !log.performedBy.id) return false;
    const hour = new Date(log.timestamp).getHours();
    return hour < 7 || hour >= 20;
  });

  if (afterHoursLogs.length > 0) {
    // Group by user
    const afterHoursByUser = new Map<string, AuditLogEntry[]>();
    afterHoursLogs.forEach(log => {
      if (!log.performedBy || !log.performedBy.id) return;
      const key = log.performedBy.id;
      if (!afterHoursByUser.has(key)) afterHoursByUser.set(key, []);
      afterHoursByUser.get(key)!.push(log);
    });

    afterHoursByUser.forEach((logs, userId) => {
      if (logs.length >= 3 && logs[0].performedBy) {
        suspicious.push({
          id: `suspicious-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "after_hours",
          severity: "low",
          description: `${logs[0].performedBy.name || logs[0].performedBy.email || 'Unknown user'} performed ${logs.length} actions outside business hours`,
          logs: logs.slice(0, 10),
          detectedAt: new Date().toISOString(),
        });
      }
    });
  }

  // Detect bulk deletions (3+ deletions within 5 minutes)
  const deletionActions = logs.filter(log => {
    if (!log.performedBy || !log.actionType) return false;
    return (
      log.actionType.includes("deleted") || 
      log.actionType.includes("cancelled") ||
      log.actionType.includes("deactivated")
    );
  });

  for (let i = 0; i < deletionActions.length - 2; i++) {
    const timeWindow = deletionActions.slice(i, i + 3);
    if (!timeWindow[0].performedBy) continue;
    
    const firstTime = new Date(timeWindow[0].timestamp).getTime();
    const lastTime = new Date(timeWindow[2].timestamp).getTime();
    
    if (lastTime - firstTime <= 300000) { // Within 5 minutes
      suspicious.push({
        id: `suspicious-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "bulk_deletion",
        severity: "high",
        description: `${timeWindow[0].performedBy.name || timeWindow[0].performedBy.email || 'Unknown user'} performed multiple deletions/cancellations within 5 minutes`,
        logs: timeWindow,
        detectedAt: new Date().toISOString(),
      });
      break;
    }
  }

  return suspicious;
}

// Helper: Get related actions for an entity
export function getRelatedActions(entityType: string, entityId: string): AuditLogEntry[] {
  const logs = getAuditLogs();
  return logs.filter(log => 
    log.targetEntity && log.targetEntity.type === entityType && log.targetEntity.id === entityId
  );
}

// Helper: Get user activity summary
export interface UserActivitySummary {
  userId: string;
  userName: string;
  email: string;
  role: string;
  totalActions: number;
  actionsToday: number;
  actionsThisWeek: number;
  mostCommonAction: string;
  lastActivity: string;
}

export function getUserActivitySummary(): UserActivitySummary[] {
  const logs = getAuditLogs();
  const userMap = new Map<string, AuditLogEntry[]>();
  
  logs.forEach(log => {
    // Safety check - skip logs with missing performedBy data
    if (!log.performedBy || !log.performedBy.id) return;
    
    const key = log.performedBy.id;
    if (!userMap.has(key)) userMap.set(key, []);
    userMap.get(key)!.push(log);
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const summaries: UserActivitySummary[] = [];

  userMap.forEach((userLogs, userId) => {
    const actionsToday = userLogs.filter(l => new Date(l.timestamp) >= today).length;
    const actionsThisWeek = userLogs.filter(l => new Date(l.timestamp) >= thisWeek).length;
    
    const actionCounts = new Map<string, number>();
    userLogs.forEach(log => {
      actionCounts.set(log.actionType, (actionCounts.get(log.actionType) || 0) + 1);
    });
    
    let mostCommonAction = "";
    let maxCount = 0;
    actionCounts.forEach((count, action) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonAction = action;
      }
    });

    summaries.push({
      userId,
      userName: userLogs[0].performedBy.name || "",
      email: userLogs[0].performedBy.email,
      role: userLogs[0].performedBy.role,
      totalActions: userLogs.length,
      actionsToday,
      actionsThisWeek,
      mostCommonAction: getActionTypeDisplayName(mostCommonAction as AuditActionType),
      lastActivity: userLogs[0].timestamp,
    });
  });

  return summaries.sort((a, b) => b.totalActions - a.totalActions);
}