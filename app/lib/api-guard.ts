import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "./db";
import { getCurrentUser, canEdit, canEditTask } from "./auth";
import type { RoleCode, SessionUser } from "./types";

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

const FORBID_TASK = NextResponse.json(
  { error: "Forbidden — you can only update tasks assigned to you or your department" },
  { status: 403 },
);

/** Editor guard scoped to a single task: managers pass; engineers must own the
    task or share its department. */
export async function requireTaskEditor(taskId: number): Promise<Guard> {
  const guard = await requireEditor();
  if ("res" in guard) return guard;
  if (guard.user.role === "ADMIN") return guard;
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { owner: true, roleCode: true } });
  if (!task) return { res: NextResponse.json({ error: "Task not found" }, { status: 404 }) };
  if (!canEditTask(guard.user, { owner: task.owner, role: task.roleCode as RoleCode })) return { res: FORBID_TASK };
  return guard;
}

/** Same scope check, resolving the owning task from a subtask id. */
export async function requireSubtaskEditor(subtaskId: number): Promise<Guard> {
  const guard = await requireEditor();
  if ("res" in guard) return guard;
  if (guard.user.role === "ADMIN") return guard;
  const sub = await prisma.subtask.findUnique({
    where: { id: subtaskId },
    select: { task: { select: { owner: true, roleCode: true } } },
  });
  if (!sub) return { res: NextResponse.json({ error: "Subtask not found" }, { status: 404 }) };
  if (!canEditTask(guard.user, { owner: sub.task.owner, role: sub.task.roleCode as RoleCode })) {
    return { res: FORBID_TASK };
  }
  return guard;
}
