"use client";

import { AccountPage } from "@/views/AccountPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const handleNavigate = (page: string) => {
    router.push(page);
  };

  return <AccountPage onNavigate={handleNavigate} />;
}
