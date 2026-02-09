"use client";

import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { canAccessAdmin, isAuthenticated } = useAuth();

  // Redirect non-admin users
  if (!isAuthenticated()) {
    redirect("/login");
  }

  if (!canAccessAdmin()) {
    redirect("/");
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
