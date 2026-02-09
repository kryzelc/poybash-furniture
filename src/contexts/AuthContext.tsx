/**
 * Auth Context - REFACTORED to MVVM
 * 
 * This context now only provides global auth state access.
 * All business logic is in useAuthViewModel.
 */

"use client";

import {
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { SignUpData, SignInData } from "@/services/authService";
import { CreateOrderInput } from "@/services/orderService";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signUp: (data: SignUpData) => Promise<{ success: boolean; user?: User | null; error?: string }>;
  signIn: (data: SignInData) => Promise<{ success: boolean; user?: User | null; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>) => Promise<{ success: boolean; user?: User; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  placeOrder: (orderData: CreateOrderInput) => Promise<Order>;
  getMyOrders: () => Promise<Order[]>;
  cancelOrder: (orderId: string, reason?: string) => Promise<Order>;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
  isStaff: () => boolean;
  canAccessAdmin: () => boolean;
  loadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use ViewModel for all business logic
  const viewModel = useAuthViewModel();

  return (
    <AuthContext.Provider value={viewModel}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
