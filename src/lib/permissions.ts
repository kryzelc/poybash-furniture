/**
 * Role-Based Access Control (RBAC) System for PoyBash Furniture
 * Following e-commerce industry best practices
 * 
 * ROLE HIERARCHY:
 * - Customer: Self-service shopping and account management
 * - Sales Staff: Customer-facing operations, order creation, refund processing
 * - Inventory Clerk: Warehouse operations, stock management, order fulfillment
 * - Admin: Full operational management (cannot create other admins)
 * - Owner: Ultimate system authority
 */

export type Permission =
  // Order Management
  | 'view:orders' // Backward compatibility - same as view:all-orders
  | 'view:all-orders'
  | 'view:own-orders'
  | 'create:manual-orders'
  | 'update:order-status'
  | 'cancel:orders'
  | 'process:refunds'
  | 'view:refund-requests'
  
  // Product & Inventory Management
  | 'view:products'
  | 'create:products'
  | 'edit:products' // Backward compatibility
  | 'update:products'
  | 'delete:products'
  | 'manage:inventory'
  | 'view:inventory-levels'
  | 'transfer:stock'
  | 'fulfill:orders'
  
  // User & Account Management
  | 'view:accounts' // Backward compatibility
  | 'view:all-users'
  | 'create:customer-accounts'
  | 'create:staff-accounts'
  | 'create:clerk-accounts'
  | 'create:admin-accounts'
  | 'update:user-accounts'
  | 'deactivate:user-accounts'
  
  // Coupon Management
  | 'view:coupons'
  | 'create:coupons'
  | 'update:coupons'
  | 'delete:coupons'
  
  // Financial & Reporting
  | 'view:revenue'
  | 'view:detailed-analytics'
  | 'export:reports'
  
  // Customer Service
  | 'view:customer-details'
  | 'view:customer-info'
  | 'contact:customers'
  
  // System Administration
  | 'access:admin-panel'
  | 'manage:system-settings';

export type Role = 'customer' | 'staff' | 'inventory-clerk' | 'admin' | 'owner';

/**
 * Define permissions for each role following e-commerce best practices
 */
const rolePermissions: Record<Role, Permission[]> = {
  /**
   * CUSTOMER - Self-service capabilities only
   * Can place orders, manage their account, and request refunds
   */
  customer: [
    'view:own-orders',
    'view:products',
    'view:inventory-levels', // Can see stock availability
    'view:coupons', // Can view available coupons
    'cancel:orders', // Can cancel own orders before processing
  ],

  /**
   * SALES STAFF - Customer-facing operations
   * Primary focus: Selling, order creation, customer service, and refund processing
   * Fast customer service with audit trail accountability
   * 
   * KEY PERMISSION: process:refunds ✅
   * - Sales staff can immediately process refunds for fast customer service
   * - All refunds have comprehensive audit trail (who, when, amount, method, proof, notes)
   * - Reduces operational bottlenecks while maintaining full accountability
   */
  staff: [
    // Order Management
    'view:orders', // Backward compatibility
    'view:all-orders',
    'view:own-orders',
    'create:manual-orders', // Create orders for walk-in/phone customers
    'update:order-status', // Can advance orders forward (not backward)
    'cancel:orders',
    'process:refunds', // ✅ ENABLED: Process refunds with full audit trail
    'view:refund-requests',
    
    // Product & Inventory
    'view:products',
    'view:inventory-levels', // Can check stock to inform customers
    
    // User & Account Management
    'view:accounts', // Backward compatibility
    'view:all-users', // View customers for order creation
    'create:customer-accounts', // Can register walk-in customers
    
    // Coupon Management
    'view:coupons',
    
    // Financial & Reporting
    'view:revenue', // Can see sales metrics for motivation
    
    // Customer Service
    'view:customer-details',
    'view:customer-info',
    'contact:customers',
    
    // System Administration
    'access:admin-panel', // Limited access to orders and customers
  ],

  /**
   * INVENTORY CLERK - Warehouse & fulfillment operations
   * Primary focus: Stock management, inventory control, and order fulfillment
   * NOT customer-facing, so NO refund processing
   * 
   * KEY EXCLUSION: process:refunds ❌
   * - Inventory clerks work in warehouse, not with customers
   * - Refund processing is a customer-facing sales function
   * - Maintains clear separation of duties
   */
  'inventory-clerk': [
    // Order Management
    'view:orders', // Backward compatibility
    'view:all-orders',
    'view:own-orders',
    'update:order-status', // Can update fulfillment statuses
    
    // Product & Inventory
    'view:products',
    'edit:products', // Backward compatibility
    'update:products', // Can update stock quantities
    'manage:inventory', // ✅ Primary responsibility
    'view:inventory-levels',
    'transfer:stock', // Transfer between warehouses
    
    // Financial & Reporting
    'export:reports', // Can export inventory reports
    
    // Customer Service
    'view:customer-info', // For shipping labels only
    
    // System Administration
    'access:admin-panel', // Limited access to inventory and fulfillment
  ],

  /**
   * ADMIN - Operational management
   * Can manage most aspects except creating other admins/owners
   * Primary business operator role
   */
  admin: [
    // Order Management
    'view:orders', // Backward compatibility
    'view:all-orders',
    'view:own-orders',
    'create:manual-orders',
    'update:order-status', // Full control: forward and backward
    'cancel:orders',
    'process:refunds',
    'view:refund-requests',
    
    // Product & Inventory
    'view:products',
    'create:products',
    'edit:products', // Backward compatibility
    'update:products',
    'delete:products',
    'manage:inventory',
    'view:inventory-levels',
    'transfer:stock',
    'fulfill:orders',
    
    // User & Account Management
    'view:accounts', // Backward compatibility
    'view:all-users',
    'create:customer-accounts',
    'create:staff-accounts',
    'create:clerk-accounts',
    'update:user-accounts',
    'deactivate:user-accounts',
    // NOTE: Cannot create admin accounts - only Owner can
    
    // Coupon Management
    'view:coupons',
    'create:coupons',
    'update:coupons',
    'delete:coupons',
    
    // Financial & Reporting
    'view:revenue',
    'view:detailed-analytics',
    'export:reports',
    
    // Customer Service
    'view:customer-details',
    'view:customer-info',
    'contact:customers',
    
    // System Administration
    'access:admin-panel',
    'manage:system-settings', // Limited system settings
  ],

  /**
   * OWNER - Complete system access
   * Ultimate authority, can do everything
   * Strategic oversight and business management
   */
  owner: [
    // Order Management
    'view:orders', // Backward compatibility
    'view:all-orders',
    'view:own-orders',
    'create:manual-orders',
    'update:order-status',
    'cancel:orders',
    'process:refunds',
    'view:refund-requests',
    
    // Product & Inventory
    'view:products',
    'create:products',
    'edit:products', // Backward compatibility
    'update:products',
    'delete:products',
    'manage:inventory',
    'view:inventory-levels',
    'transfer:stock',
    'fulfill:orders',
    
    // User & Account Management
    'view:accounts', // Backward compatibility
    'view:all-users',
    'create:customer-accounts',
    'create:staff-accounts',
    'create:clerk-accounts',
    'create:admin-accounts', // ✅ Only Owner can create Admins
    'update:user-accounts',
    'deactivate:user-accounts',
    
    // Coupon Management
    'view:coupons',
    'create:coupons',
    'update:coupons',
    'delete:coupons',
    
    // Financial & Reporting
    'view:revenue',
    'view:detailed-analytics',
    'export:reports',
    
    // Customer Service
    'view:customer-details',
    'view:customer-info',
    'contact:customers',
    
    // System Administration
    'access:admin-panel',
    'manage:system-settings', // Full system control
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return rolePermissions[role] ?? [];
}

/**
 * Get readable role name
 */
export function getRoleName(role: Role): string {
  const roleNames: Record<Role, string> = {
    customer: 'Customer',
    staff: 'Sales Staff',
    'inventory-clerk': 'Inventory Clerk',
    admin: 'Administrator',
    owner: 'Owner',
  };
  return roleNames[role] ?? role;
}

/**
 * Get role description with focus areas
 */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    customer: 'Browse products, place orders, and manage personal account',
    staff: 'Customer-facing sales, order creation, and refund processing with full audit trail',
    'inventory-clerk': 'Warehouse operations, stock management, and order fulfillment',
    admin: 'Full operational management including users, products, and orders',
    owner: 'Complete system access with strategic oversight and business management',
  };
  return descriptions[role] ?? '';
}

/**
 * Get available roles for account creation based on current user role
 */
export function getCreatableRoles(currentRole: Role): Role[] {
  if (currentRole === 'owner') {
    return ['customer', 'staff', 'inventory-clerk', 'admin'];
  }
  if (currentRole === 'admin') {
    return ['customer', 'staff', 'inventory-clerk'];
  }
  if (currentRole === 'staff') {
    return ['customer']; // Sales staff can register walk-in customers
  }
  return [];
}

/**
 * Check if user can create accounts of a specific role
 */
export function canCreateRole(currentRole: Role, targetRole: Role): boolean {
  const creatableRoles = getCreatableRoles(currentRole);
  return creatableRoles.includes(targetRole);
}

/**
 * Get role badge color for UI display
 */
export function getRoleBadgeColor(role: Role): string {
  const colors: Record<Role, string> = {
    customer: 'bg-blue-100 text-blue-700 border-blue-200',
    staff: 'bg-green-100 text-green-700 border-green-200',
    'inventory-clerk': 'bg-purple-100 text-purple-700 border-purple-200',
    admin: 'bg-orange-100 text-orange-700 border-orange-200',
    owner: 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[role] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}