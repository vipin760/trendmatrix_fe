import { createHmac, timingSafeEqual } from "node:crypto";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "change-me-admin-secret";

type SessionPayload = { u: string; exp: number };

function sign(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

export function validateAdminCredentials(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function createSessionToken(username: string) {
  const payload: SessionPayload = { u: username, exp: Date.now() + SESSION_TTL_MS };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token?: string | null) {
  if (!token) return null;
  const [encodedPayload, sentSignature] = token.split(".");
  if (!encodedPayload || !sentSignature) return null;

  const expectedSignature = sign(encodedPayload);
  const sent = Buffer.from(sentSignature);
  const expected = Buffer.from(expectedSignature);
  if (sent.length !== expected.length) return null;
  if (!timingSafeEqual(sent, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.u || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isAdminAuthenticated(cookieStore: ReadonlyRequestCookies) {
  return Boolean(verifySessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value));
}

export const adminSessionMaxAgeSeconds = SESSION_TTL_MS / 1000;
