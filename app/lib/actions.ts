"use server";

import { redirect } from "next/navigation";
import { prisma } from "./db";
import { verifyPassword } from "./password";
import { setSessionCookie, clearSessionCookie, getCurrentUser } from "./auth";
import { changePassword } from "./mutations";
import type { Role, RoleCode } from "./types";

export interface LoginState {
  error?: string;
}

export interface PasswordState {
  error?: string;
  ok?: string;
}

export async function changePasswordAction(_prev: PasswordState, fd: FormData): Promise<PasswordState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (!current || !next) return { error: "Fill in all fields." };
  if (next !== confirm) return { error: "New passwords don't match." };
  try {
    await changePassword(user.uid, current, next);
    return { ok: "Password updated." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't update password." };
  }
}

/** Safe internal redirect target (prevents open-redirect). */
function safePath(value: FormDataEntryValue | null): string {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const dest = safePath(formData.get("redirectTo"));

  if (!email || !password) return { error: "Enter both email and password." };

  const user = await prisma.user.findUnique({ where: { email } });
  // Always run verify to keep timing roughly constant whether or not the user exists.
  const ok = user ? verifyPassword(password, user.passwordHash) : verifyPassword(password, "x:y");
  if (!user || !ok) return { error: "Invalid email or password." };

  await setSessionCookie({
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    department: (user.department as RoleCode) ?? null,
  });
  redirect(dest);
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
