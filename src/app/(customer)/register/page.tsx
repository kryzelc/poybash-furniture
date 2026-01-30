"use client";

import { RegisterPage } from "@/views/RegisterPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const handleNavigate = (
    page: string,
    id?: number | string,
    email?: string,
  ) => {
    if (email) {
      router.push(`/${page}?email=${encodeURIComponent(email)}`);
    } else if (id) {
      router.push(`/${page}/${id}`);
    } else {
      router.push(`/${page}`);
    }
  };

  return <RegisterPage onNavigate={handleNavigate} />;
}
