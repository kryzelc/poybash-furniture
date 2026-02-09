import type { User as UserType } from "@/models/User";

export interface DBUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: "customer" | "staff" | "inventory-clerk" | "admin" | "owner";
  active: boolean;
  created_at: string;
  updated_at: string;
}

// LocalStorage key for users
const STORAGE_KEY = "poybash_users";

// Helper: Generate unique ID
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper: Hash password (simple implementation)
const hashPassword = (password: string): string => {
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
  UserType & { passwordHash: string }
> => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Helper: Save users to localStorage
const saveUsersToStorage = (
  users: Array<UserType & { passwordHash: string }>,
) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export async function getAllUsers(): Promise<
  (UserType & { password?: string })[]
> {
  try {
    const users = getAllUsersFromStorage();
    // Remove password hash from returned data (for security)
    return users.map(({ passwordHash, ...user }) => user);
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

/**
 * Get all users WITH password hashes (for authentication only)
 * INTERNAL USE ONLY - Do not expose to UI
 */
export async function getAllUsersWithHashes(): Promise<
  Array<UserType & { passwordHash: string }>
> {
  try {
    return getAllUsersFromStorage();
  } catch (error) {
    console.error("Error fetching users with hashes:", error);
    return [];
  }
}

export async function getUserById(userId: string): Promise<UserType | null> {
  try {
    const users = getAllUsersFromStorage();
    const user = users.find((u) => u.id === userId);
    if (!user) return null;

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function updateUserRole(
  userId: string,
  newRole: "customer" | "staff" | "inventory-clerk" | "admin" | "owner",
): Promise<boolean> {
  try {
    const users = getAllUsersFromStorage();
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, role: newRole } : u,
    );
    saveUsersToStorage(updatedUsers);
    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    return false;
  }
}

export async function toggleUserActive(
  userId: string,
  active: boolean,
): Promise<boolean> {
  try {
    const users = getAllUsersFromStorage();
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, active } : u,
    );
    saveUsersToStorage(updatedUsers);
    return true;
  } catch (error) {
    console.error("Error toggling user active status:", error);
    return false;
  }
}

export async function updateUserInfo(
  userId: string,
  updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  },
): Promise<boolean> {
  try {
    const users = getAllUsersFromStorage();
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, ...updates } : u,
    );
    saveUsersToStorage(updatedUsers);
    return true;
  } catch (error) {
    console.error("Error updating user info:", error);
    return false;
  }
}

export async function createUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "customer" | "admin" | "owner" | "staff" | "inventory-clerk";
}): Promise<string | null> {
  try {
    const users = getAllUsersFromStorage();

    // Check if email already exists
    if (
      users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())
    ) {
      console.error("Email already exists");
      return null;
    }

    const newUser: UserType & { passwordHash: string } = {
      id: generateId(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: userData.role,
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: false,
      active: true,
      passwordHash: hashPassword(userData.password),
    };

    users.push(newUser);
    saveUsersToStorage(users);

    return newUser.id;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

export async function checkEmailExists(
  email: string,
  excludeUserId?: string,
): Promise<boolean> {
  try {
    const users = getAllUsersFromStorage();
    return users.some(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() && u.id !== excludeUserId,
    );
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
}

function transformDBUserToAppUser(dbUser: any): UserType {
  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.first_name || dbUser.firstName,
    lastName: dbUser.last_name || dbUser.lastName,
    role: dbUser.role,
    phone: dbUser.phone,
    active: dbUser.active,
    createdAt: dbUser.created_at || dbUser.createdAt,
    updatedAt:
      dbUser.updated_at || dbUser.updatedAt || new Date().toISOString(),
    emailVerified: dbUser.email_verified || dbUser.emailVerified || false,
    addresses: (dbUser.addresses || []).map((addr: any) => ({
      id: addr.id,
      label: addr.label,
      firstName: addr.first_name || addr.firstName,
      lastName: addr.last_name || addr.lastName,
      address: addr.address,
      barangay: addr.barangay,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zip_code || addr.zipCode,
      country: addr.country,
      phone: addr.phone,
      isDefault: addr.is_default ?? addr.isDefault,
    })),
  };
}
