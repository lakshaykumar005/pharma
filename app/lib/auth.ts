import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
} from "./session";
import type { Role, SessionUser } from "./types";

/** Read + verify the current session from the cookie. Null if not signed in. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const data = verifySession(store.get(SESSION_COOKIE)?.value);
  if (!data) return null;
  return { uid: data.uid, email: data.email, name: data.name, role: data.role };
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function canEdit(role: Role | undefined | null): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

/** Gate a page server component: redirect to /login when unauthenticated. */
export async function requireUser(from?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${from ? `?from=${encodeURIComponent(from)}` : ""}`);
  return user;
}
