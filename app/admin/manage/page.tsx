"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/client/auth-api";
import AdminManageClient from "./AdminManageClient";

export default function AdminManagePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getMe()
      .then(() => setReady(true))
      .catch(() => {
        router.replace("/admin/login");
      });
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-100 to-emerald-100">
        <p className="text-sm font-semibold text-gray-700">Checking admin session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-emerald-100 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Manage Trading Data</h1>
            <p className="text-sm text-gray-600">Create, edit, and delete live predictions and history records.</p>
          </div>
          <Link href="/admin/dashboard" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700">
            Back to Dashboard
          </Link>
          <Link href="/admin/analytics" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
            Open Analytics
          </Link>
        </header>

        <AdminManageClient />
      </div>
    </div>
  );
}
