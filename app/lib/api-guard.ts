import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser, canEdit } from "./auth";
import type { SessionUser } from "./types";

/** CSRF: reject cross-origin browser writes (cookie is also SameSite=Lax). */
export function checkOrigin(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) return null; // non-browser / same-origin server calls
  try {
    if (new URL(origin).host !== req.headers.get("host")) {
      return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
  return null;
}

type Guard = { user: SessionUser } | { res: NextResponse };

export async function requireAuth(): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user) return { res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { user };
}

export async function requireEditor(): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user) return { res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!canEdit(user.role)) {
    return { res: NextResponse.json({ error: "Forbidden — editor access required" }, { status: 403 }) };
  }
  return { user };
}
