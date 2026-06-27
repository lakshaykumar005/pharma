import { createHmac, timingSafeEqual } from "node:crypto";
import type { SessionUser } from "./types";

/* Stateless signed-cookie sessions: base64url(payload).hmac(payload).
   No next/headers or server-only imports, so this is safe to use in proxy.ts
   (Node runtime) as well as routes and server components. */

const SECRET = (() => {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set (>=16 chars) in production.");
  }
  return "dev-insecure-secret-change-me-please";
})();
export const SESSION_COOKIE = "anthem_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

type Payload = SessionUser & { exp: number };

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function signSession(user: SessionUser): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = Buffer.from(JSON.stringify({ ...user, exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string | undefined | null): Payload | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as Payload;
    if (typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}
