/**
 * User Domain Models
 * 
 * Pure data structures for user authentication and profile.
 */

export type UserRole = 
  | 'customer'
  | 'staff'
  | 'inventory-clerk'
  | 'admin'
  | 'owner';

export interface Address {
  id: string;
  userId: string;
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
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  active: boolean;
  lastLoginAt?: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Get user's full name
 */
export function getUserFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

/**
 * Get user's default address
 */
export function getDefaultAddress(user: User): Address | undefined {
  return user.addresses.find(addr => addr.isDefault && addr.active);
}

/**
 * Check if user has specific role
 */
export function hasRole(user: User, role: UserRole): boolean {
  return user.role === role;
}

/**
 * Check if user is staff or above (staff, clerk, admin, owner)
 */
export function isStaffOrAbove(user: User): boolean {
  return ['staff', 'inventory-clerk', 'admin', 'owner'].includes(user.role);
}

/**
 * Check if user is admin or owner
 */
export function isAdminOrOwner(user: User): boolean {
  return user.role === 'admin' || user.role === 'owner';
}

/**
 * Check if user can manage inventory
 */
export function canManageInventory(user: User): boolean {
  return ['inventory-clerk', 'admin', 'owner'].includes(user.role);
}

/**
 * Check if user can access admin dashboard
 */
export function canAccessAdminDashboard(user: User): boolean {
  return isStaffOrAbove(user);
}

/**
 * Check if user can view audit logs
 */
export function canViewAuditLogs(user: User): boolean {
  return user.role === 'owner';
}
