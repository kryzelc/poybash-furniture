"use client";

import { AdminDashboardPage } from "@/views/AdminDashboardPage";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { canAccessAdmin, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else if (!canAccessAdmin()) {
      router.push("/");
    }
  }, [canAccessAdmin, isAuthenticated, router]);

  const handleNavigate = (page: string) => {
    if (page === "login") {
      router.push("/login");
    } else if (page === "home") {
      router.push("/");
    }
  };

  if (!canAccessAdmin()) {
    return null;
  }

  return <AdminDashboardPage onNavigate={handleNavigate} />;
}
