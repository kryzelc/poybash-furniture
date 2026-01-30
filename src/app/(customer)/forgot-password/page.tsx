"use client";

import { ForgotPasswordPage } from "@/views/ForgotPasswordPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const handleNavigate = (page: string) => {
    router.push(`/${page}`);
  };

  return <ForgotPasswordPage onNavigate={handleNavigate} />;
}
