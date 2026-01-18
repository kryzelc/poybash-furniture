/**
 * Role-Based Access Control (RBAC) System
 * Following e-commerce industry best practices
 */

export type UserRole = 'customer' | 'staff' | 'inventory-clerk' | 'admin' | 'owner';

export interface RolePermissions {
  // Order Management
  viewAllOrders: boolean;
  viewOwnOrders: boolean;
  createManualOrder: boolean;
  updateOrderStatus: boolean;
  cancelOrder: boolean;
  processRefunds: boolean;
  viewRefundRequests: boolean;
  
  // Product & Inventory Management
  viewProducts: boolean;
  createProduct: boolean;
  updateProduct: boolean;
  deleteProduct: boolean;
  manageInventory: boolean;
  viewInventoryLevels: boolean;
  transferStock: boolean;
  fulfillOrders: boolean;
  
  // User & Account Management
  viewAllUsers: boolean;
  createCustomerAccount: boolean;
  createStaffAccount: boolean;
  createInventoryClerkAccount: boolean;
  createAdminAccount: boolean;
  updateUserAccount: boolean;
  deactivateUserAccount: boolean;
  
  // Coupon Management
  viewCoupons: boolean;
  createCoupon: boolean;
  updateCoupon: boolean;
  deleteCoupon: boolean;
  
  // Financial & Reporting
  viewRevenue: boolean;
  viewDetailedAnalytics: boolean;
  exportReports: boolean;
  
  // Customer Service
  viewCustomerInfo: boolean;
  contactCustomers: boolean;
  
  // System Administration
  accessAdminPanel: boolean;
  manageSystemSettings: boolean;
}

/**
 * Define permissions for each role following e-commerce best practices
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  /**
   * CUSTOMER - Self-service capabilities only
   * Can place orders, manage their account, and request refunds
   */
  customer: {
    // Order Management
    viewAllOrders: false,
    viewOwnOrders: true,
    createManualOrder: false,
    updateOrderStatus: false,
    cancelOrder: true, // Can cancel own orders
    processRefunds: false,
    viewRefundRequests: false,
    
    // Product & Inventory
    viewProducts: true,
    createProduct: false,
    updateProduct: false,
    deleteProduct: false,
    manageInventory: false,
    viewInventoryLevels: true, // Can see stock availability
    transferStock: false,
    fulfillOrders: false,
    
    // User & Account Management
    viewAllUsers: false,
    createCustomerAccount: false,
    createStaffAccount: false,
    createInventoryClerkAccount: false,
    createAdminAccount: false,
    updateUserAccount: false, // Can only update own account
    deactivateUserAccount: false,
    
    // Coupon Management
    viewCoupons: true, // Can view available coupons
    createCoupon: false,
    updateCoupon: false,
    deleteCoupon: false,
    
    // Financial & Reporting
    viewRevenue: false,
    viewDetailedAnalytics: false,
    exportReports: false,
    
    // Customer Service
    viewCustomerInfo: false,
    contactCustomers: false,
    
    // System Administration
    accessAdminPanel: false,
    manageSystemSettings: false,
  },

  /**
   * SALES STAFF - Customer-facing operations
   * Primary focus: Selling, order creation, customer service, and refund processing
   * Fast customer service with audit trail accountability
   */
  staff: {
    // Order Management
    viewAllOrders: true,
    viewOwnOrders: true,
    createManualOrder: true, // Create orders for walk-in/phone customers
    updateOrderStatus: true, // Limited: Can advance orders forward, not backward
    cancelOrder: true,
    processRefunds: true, // ✅ ENABLED: Process refunds with full audit trail
    viewRefundRequests: true,
    
    // Product & Inventory
    viewProducts: true,
    createProduct: false,
    updateProduct: false,
    deleteProduct: false,
    manageInventory: false, // Cannot modify stock levels
    viewInventoryLevels: true, // Can check stock to inform customers
    transferStock: false,
    fulfillOrders: false, // Fulfillment is warehouse responsibility
    
    // User & Account Management
    viewAllUsers: true, // View customers for order creation
    createCustomerAccount: true, // Can register walk-in customers
    createStaffAccount: false,
    createInventoryClerkAccount: false,
    createAdminAccount: false,
    updateUserAccount: false,
    deactivateUserAccount: false,
    
    // Coupon Management
    viewCoupons: true,
    createCoupon: false,
    updateCoupon: false,
    deleteCoupon: false,
    
    // Financial & Reporting
    viewRevenue: true, // Can see sales metrics for motivation
    viewDetailedAnalytics: false,
    exportReports: false,
    
    // Customer Service
    viewCustomerInfo: true,
    contactCustomers: true,
    
    // System Administration
    accessAdminPanel: true, // Limited access to orders and customers
    manageSystemSettings: false,
  },

  /**
   * INVENTORY CLERK - Warehouse & fulfillment operations
   * Primary focus: Stock management, inventory control, and order fulfillment
   * NOT customer-facing, so no refund processing
   */
  'inventory-clerk': {
    // Order Management
    viewAllOrders: true,
    viewOwnOrders: true,
    createManualOrder: false, // Not customer-facing
    updateOrderStatus: true, // Can update fulfillment statuses
    cancelOrder: false, // Cannot cancel orders
    processRefunds: false, // ❌ NOT customer-facing role
    viewRefundRequests: false,
    
    // Product & Inventory
    viewProducts: true,
    createProduct: false,
    updateProduct: true, // Can update stock quantities
    deleteProduct: false,
    manageInventory: true, // ✅ Primary responsibility
    viewInventoryLevels: true,
    transferStock: true, // Transfer between warehouses
    fulfillOrders: true, // ✅ Primary responsibility
    
    // User & Account Management
    viewAllUsers: false,
    createCustomerAccount: false,
    createStaffAccount: false,
    createInventoryClerkAccount: false,
    createAdminAccount: false,
    updateUserAccount: false,
    deactivateUserAccount: false,
    
    // Coupon Management
    viewCoupons: false,
    createCoupon: false,
    updateCoupon: false,
    deleteCoupon: false,
    
    // Financial & Reporting
    viewRevenue: false,
    viewDetailedAnalytics: false,
    exportReports: true, // Can export inventory reports
    
    // Customer Service
    viewCustomerInfo: true, // For shipping labels
    contactCustomers: false,
    
    // System Administration
    accessAdminPanel: true, // Limited access to inventory and fulfillment
    manageSystemSettings: false,
  },

  /**
   * ADMIN - Operational management
   * Can manage most aspects except creating other admins/owners
   * Primary business operator role
   */
  admin: {
    // Order Management
    viewAllOrders: true,
    viewOwnOrders: true,
    createManualOrder: true,
    updateOrderStatus: true, // Full control: forward and backward
    cancelOrder: true,
    processRefunds: true,
    viewRefundRequests: true,
    
    // Product & Inventory
    viewProducts: true,
    createProduct: true,
    updateProduct: true,
    deleteProduct: true,
    manageInventory: true,
    viewInventoryLevels: true,
    transferStock: true,
    fulfillOrders: true,
    
    // User & Account Management
    viewAllUsers: true,
    createCustomerAccount: true,
    createStaffAccount: true,
    createInventoryClerkAccount: true,
    createAdminAccount: false, // Only Owner can create Admins
    updateUserAccount: true,
    deactivateUserAccount: true,
    
    // Coupon Management
    viewCoupons: true,
    createCoupon: true,
    updateCoupon: true,
    deleteCoupon: true,
    
    // Financial & Reporting
    viewRevenue: true,
    viewDetailedAnalytics: true,
    exportReports: true,
    
    // Customer Service
    viewCustomerInfo: true,
    contactCustomers: true,
    
    // System Administration
    accessAdminPanel: true,
    manageSystemSettings: true, // Limited system settings
  },

  /**
   * OWNER - Complete system access
   * Ultimate authority, can do everything
   * Strategic oversight and business management
   */
  owner: {
    // Order Management
    viewAllOrders: true,
    viewOwnOrders: true,
    createManualOrder: true,
    updateOrderStatus: true,
    cancelOrder: true,
    processRefunds: true,
    viewRefundRequests: true,
    
    // Product & Inventory
    viewProducts: true,
    createProduct: true,
    updateProduct: true,
    deleteProduct: true,
    manageInventory: true,
    viewInventoryLevels: true,
    transferStock: true,
    fulfillOrders: true,
    
    // User & Account Management
    viewAllUsers: true,
    createCustomerAccount: true,
    createStaffAccount: true,
    createInventoryClerkAccount: true,
    createAdminAccount: true, // ✅ Only Owner can create Admins
    updateUserAccount: true,
    deactivateUserAccount: true,
    
    // Coupon Management
    viewCoupons: true,
    createCoupon: true,
    updateCoupon: true,
    deleteCoupon: true,
    
    // Financial & Reporting
    viewRevenue: true,
    viewDetailedAnalytics: true,
    exportReports: true,
    
    // Customer Service
    viewCustomerInfo: true,
    contactCustomers: true,
    
    // System Administration
    accessAdminPanel: true,
    manageSystemSettings: true, // Full system control
  },
};

/**
 * Get permissions for a specific role
 */
export function getPermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Check if user can perform an action
 */
export function canPerformAction(
  userRole: UserRole | undefined,
  permission: keyof RolePermissions
): boolean {
  if (!userRole) return false;
  return hasPermission(userRole, permission);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    customer: 'Customer',
    staff: 'Sales Staff',
    'inventory-clerk': 'Inventory Clerk',
    admin: 'Administrator',
    owner: 'Owner',
  };
  return roleNames[role];
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    customer: 'Browse products, place orders, and manage personal account',
    staff: 'Customer-facing sales, order creation, and refund processing',
    'inventory-clerk': 'Warehouse operations, stock management, and order fulfillment',
    admin: 'Full operational management including users, products, and orders',
    owner: 'Complete system access with strategic oversight and business management',
  };
  return descriptions[role];
}

/**
 * Get roles that can be created by a specific role
 */
export function getCreatableRoles(creatorRole: UserRole): UserRole[] {
  const permissions = getPermissions(creatorRole);
  const creatableRoles: UserRole[] = [];
  
  if (permissions.createCustomerAccount) creatableRoles.push('customer');
  if (permissions.createStaffAccount) creatableRoles.push('staff');
  if (permissions.createInventoryClerkAccount) creatableRoles.push('inventory-clerk');
  if (permissions.createAdminAccount) creatableRoles.push('admin');
  
  return creatableRoles;
}
