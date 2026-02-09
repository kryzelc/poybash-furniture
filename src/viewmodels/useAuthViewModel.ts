/**
 * Auth ViewModel
 * 
 * Manages authentication business logic and state.
 */

import { useState, useEffect, useCallback } from 'react';
import { User, isStaffOrAbove, canAccessAdminDashboard } from '@/models/User';
import { authService, SignUpData, SignInData } from '@/services/authService';
import { orderService, CreateOrderInput } from '@/services/orderService';
import { Order } from '@/models/Order';

export function useAuthViewModel() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const session = await authService.getSession();

      if (session?.user) {
        const userData = await authService.getUserById(session.user.id);
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auth actions
  const signUp = useCallback(async (data: SignUpData) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.signUp(data);

      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      setUser(result.user);
      return { success: true, user: result.user };
    } catch (err) {
      const errorMessage = 'Failed to sign up';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (data: SignInData) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.signIn(data);

      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      setUser(result.user);
      return { success: true, user: result.user };
    } catch (err) {
      const errorMessage = 'Failed to sign in';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);

      // Clear cart and coupon data on logout
      localStorage.removeItem('cart');
      localStorage.removeItem('appliedCoupon');

      // Dispatch event to notify cart to clear
      window.dispatchEvent(new Event('user-logout'));

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to sign out' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (
    updates: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>
  ) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setIsLoading(true);
      const updatedUser = await authService.updateUserProfile(user.id, updates);
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update profile';
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const changePassword = useCallback(async (newPassword: string) => {
    try {
      setIsLoading(true);
      const result = await authService.changePassword(newPassword);

      if (result.error) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to change password' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Order actions (delegated to order service)
  const placeOrder = useCallback(async (orderData: CreateOrderInput) => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    try {
      const order = await orderService.createOrder({
        ...orderData,
        userId: user.id,
      });
      return order;
    } catch (err) {
      throw err;
    }
  }, [user]);

  const getMyOrders = useCallback(async () => {
    if (!user) return [];

    try {
      return await orderService.getUserOrders(user.id);
    } catch (err) {
      console.error('Error fetching orders:', err);
      return [];
    }
  }, [user]);

  const cancelOrder = useCallback(async (orderId: string, reason?: string) => {
    try {
      return await orderService.cancelOrder(orderId, reason);
    } catch (err) {
      throw err;
    }
  }, []);

  // Helper methods
  const isAuthenticated = useCallback(() => {
    return user !== null;
  }, [user]);

  const hasRole = useCallback((role: string) => {
    return user?.role === role;
  }, [user]);

  const isStaff = useCallback(() => {
    return user ? isStaffOrAbove(user) : false;
  }, [user]);

  const canAccessAdmin = useCallback(() => {
    return user ? canAccessAdminDashboard(user) : false;
  }, [user]);

  return {
    // State
    user,
    isLoading,
    error,

    // Auth actions
    signUp,
    signIn,
    signOut,
    updateProfile,
    changePassword,
    loadUser,

    // Order actions
    placeOrder,
    getMyOrders,
    cancelOrder,

    // Helpers
    isAuthenticated,
    hasRole,
    isStaff,
    canAccessAdmin,
  };
}
