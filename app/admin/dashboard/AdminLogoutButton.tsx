"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/client/auth-api";

export function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <button type="button" onClick={handleLogout} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700">
      Logout
    </button>
  );
}
