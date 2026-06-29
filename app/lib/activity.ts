import "server-only";
import { prisma } from "./db";

/* Activity logging is best-effort: it must NEVER break the main mutation, and
   it tolerates the Activity table not existing yet (before `db:push`). */

export async function logActivity(input: {
  actor: string;
  verb: string;
  target: string;
  detail?: string;
  taskId?: number;
}): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        actor: input.actor,
        verb: input.verb,
        target: input.target,
        detail: input.detail ?? null,
        taskId: input.taskId ?? null,
      },
    });
  } catch {
    // table missing / transient — ignore so the action still succeeds
  }
}

export interface ActivityRow {
  id: number;
  actor: string;
  verb: string;
  target: string;
  detail: string | null;
  taskId: number | null;
  createdAt: string;
}

export async function getActivity(limit = 14): Promise<ActivityRow[]> {
  try {
    const rows = await prisma.activity.findMany({ orderBy: { createdAt: "desc" }, take: limit });
    return rows.map((r) => ({
      id: r.id,
      actor: r.actor,
      verb: r.verb,
      target: r.target,
      detail: r.detail,
      taskId: r.taskId,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return []; // table not created yet
  }
}
