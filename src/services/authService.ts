/**
 * Auth Service
 * 
 * Handles authentication and user management operations.
 * Supports both Supabase (production) and localStorage (demo/development).
 */

import { supabase } from './supabaseClient';
import { User, Address, getUserFullName } from '@/models/User';
import { getAllUsers as getUsersFromStorage } from './userService';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Feature flag: Use localStorage for demo mode
const USE_LOCALSTORAGE = true; // Set to false when you connect to real Supabase

class AuthService {
  /**
   * Hash password (simple implementation for demo)
   */
  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
  
  /**
   * Get current user session from localStorage
   */
  private getLocalStorageSession(): { userId: string } | null {
    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem('auth_session');
    return session ? JSON.parse(session) : null;
  }
  
  /**
   * Set current user session in localStorage
   */
  private setLocalStorageSession(userId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_session', JSON.stringify({ userId }));
  }
  
  /**
   * Clear current user session from localStorage
   */
  private clearLocalStorageSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_session');
  }
  
  /**
   * Sign in with localStorage
   */
  private async signInWithLocalStorage(data: SignInData): Promise<{ user: User | null; error: string | null }> {
    try {
      const users = await getUsersFromStorage();
      const passwordHash = this.hashPassword(data.password);
      
      const user = users.find(
        (u: any) => 
          u.email.toLowerCase() === data.email.toLowerCase() &&
          u.passwordHash === passwordHash &&
          u.active
      );
      
      if (!user) {
        return { user: null, error: 'Invalid email or password' };
      }
      
      // Create session
      this.setLocalStorageSession(user.id);
      
      return { user, error: null };
    } catch (error) {
      console.error('LocalStorage sign in error:', error);
      return { user: null, error: 'Failed to sign in' };
    }
  }
  /**
   * Sign up new user
   */
  async signUp(data: SignUpData): Promise<{ user: User | null; error: string | null }> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: 'Failed to create user' };
      }

      // Create user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          role: 'customer',
          active: true,
          email_verified: false,
        })
        .select()
        .single();

      if (userError) {
        return { user: null, error: userError.message };
      }

      return { user: this.mapToUser(userData), error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, error: 'Failed to sign up' };
    }
  }

  /**
   * Sign in user
   */
  async signIn(data: SignInData): Promise<{ user: User | null; error: string | null }> {
    // Use localStorage for demo mode
    if (USE_LOCALSTORAGE) {
      return this.signInWithLocalStorage(data);
    }
    
    // Supabase authentication (production)
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: 'Failed to sign in' };
      }

      // Get user profile
      const user = await this.getUserById(authData.user.id);
      
      if (!user) {
        return { user: null, error: 'User profile not found' };
      }

      // Update last login
      await this.updateLastLogin(user.id);

      return { user, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error: 'Failed to sign in' };
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<{ error: string | null }> {
    // Use localStorage for demo mode
    if (USE_LOCALSTORAGE) {
      this.clearLocalStorageSession();
      return { error: null };
    }
    
    // Supabase sign out (production)
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: 'Failed to sign out' };
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    // Use localStorage for demo mode
    if (USE_LOCALSTORAGE) {
      const session = this.getLocalStorageSession();
      if (!session) return null;
      
      return {
        user: { id: session.userId }
      };
    }
    
    // Supabase session (production)
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      return null;
    }

    return data.session;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    // Use localStorage for demo mode
    if (USE_LOCALSTORAGE) {
      const users = await getUsersFromStorage();
      const user = users.find((u: any) => u.id === userId && u.active);
      return user || null;
    }
    
    // Supabase (production)
    const { data, error } = await supabase
      .from('users')
      .select('*, addresses(*)')
      .eq('id', userId)
      .eq('active', true)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return this.mapToUser(data);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>
  ): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        first_name: updates.firstName,
        last_name: updates.lastName,
        phone: updates.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*, addresses(*)')
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return this.mapToUser(data);
  }

  /**
   * Add address
   */
  async addAddress(userId: string, address: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Address> {
    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: userId,
        label: address.label,
        first_name: address.firstName,
        last_name: address.lastName,
        address: address.address,
        barangay: address.barangay,
        city: address.city,
        state: address.state,
        zip_code: address.zipCode,
        country: address.country,
        phone: address.phone,
        is_default: address.isDefault,
        active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add address: ${error.message}`);
    }

    return this.mapToAddress(data);
  }

  /**
   * Update address
   */
  async updateAddress(addressId: string, updates: Partial<Address>): Promise<Address> {
    const { data, error } = await supabase
      .from('addresses')
      .update({
        label: updates.label,
        first_name: updates.firstName,
        last_name: updates.lastName,
        address: updates.address,
        barangay: updates.barangay,
        city: updates.city,
        state: updates.state,
        zip_code: updates.zipCode,
        country: updates.country,
        phone: updates.phone,
        is_default: updates.isDefault,
        updated_at: new Date().toISOString(),
      })
      .eq('id', addressId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update address: ${error.message}`);
    }

    return this.mapToAddress(data);
  }

  /**
   * Delete address (soft delete)
   */
  async deleteAddress(addressId: string): Promise<void> {
    const { error } = await supabase
      .from('addresses')
      .update({ active: false })
      .eq('id', addressId);

    if (error) {
      throw new Error(`Failed to delete address: ${error.message}`);
    }
  }

  /**
   * Change password
   */
  async changePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { error: error?.message || null };
    } catch (error) {
      console.error('Change password error:', error);
      return { error: 'Failed to change password' };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error?.message || null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: 'Failed to send reset email' };
    }
  }

  // Private helpers

  private async updateLastLogin(userId: string): Promise<void> {
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);
  }

  private mapToUser(data: any): User {
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
      phone: data.phone,
      emailVerified: data.email_verified,
      emailVerifiedAt: data.email_verified_at,
      active: data.active,
      lastLoginAt: data.last_login_at,
      addresses: data.addresses?.map((addr: any) => this.mapToAddress(addr)) || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToAddress(data: any): Address {
    return {
      id: data.id,
      userId: data.user_id,
      label: data.label,
      firstName: data.first_name,
      lastName: data.last_name,
      address: data.address,
      barangay: data.barangay,
      city: data.city,
      state: data.state,
      zipCode: data.zip_code,
      country: data.country,
      phone: data.phone,
      isDefault: data.is_default,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
