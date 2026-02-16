"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/client/auth-api";

export default function AdminHomePage() {
  const router = useRouter();

  useEffect(() => {
    if (getAccessToken()) {
      router.replace("/admin/dashboard");
      return;
    }
    router.replace("/admin/login");
  }, [router]);

  return null;
}
