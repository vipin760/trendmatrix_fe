import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, adminSessionMaxAgeSeconds, createSessionToken, validateAdminCredentials } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!validateAdminCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, createSessionToken(username), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: adminSessionMaxAgeSeconds,
  });
  return response;
}
