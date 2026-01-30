import { supabase } from "../utils/supabase/client";
import type { User as UserType } from "../contexts/AuthContext";

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

export async function getAllUsers(): Promise<
  (UserType & { password?: string })[]
> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        *,
        addresses (*)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map(transformDBUserToAppUser);
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function getUserById(userId: string): Promise<UserType | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        *,
        addresses (*)
      `,
      )
      .eq("id", userId)
      .single();

    if (error) throw error;

    return data ? transformDBUserToAppUser(data) : null;
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
    const { error } = await supabase
      .from("users")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;
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
    const { error } = await supabase
      .from("users")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;
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
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.firstName !== undefined)
      dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;

    const { error } = await supabase
      .from("users")
      .update(dbUpdates)
      .eq("id", userId);

    if (error) throw error;
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
    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      });

    if (authError) throw authError;
    if (!authData.user) return null;

    // Create user profile
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
      role: userData.role,
    });

    if (profileError) throw profileError;

    return authData.user.id;
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
    let query = supabase.from("users").select("id").eq("email", email);

    if (excludeUserId) {
      query = query.neq("id", excludeUserId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
}

function transformDBUserToAppUser(dbUser: any): UserType {
  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    role: dbUser.role,
    phone: dbUser.phone,
    active: dbUser.active,
    createdAt: dbUser.created_at,
    addresses: (dbUser.addresses || []).map((addr: any) => ({
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
}
