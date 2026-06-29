import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getTaskDetail } from "@/app/lib/queries";
import { updateTaskProgress, setTaskState } from "@/app/lib/mutations";
import { logActivity } from "@/app/lib/activity";
import { checkOrigin, requireAuth, requireEditor } from "@/app/lib/api-guard";

export const dynamic = "force-dynamic";

// GET /api/tasks/:id — one task with phase, department, dependencies, neighbours.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAuth();
  if ("res" in guard) return guard.res;

  const { id } = await params;
  const detail = await getTaskDetail(Number(id));
  if (!detail) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(detail);
}

// PATCH /api/tasks/:id — update % complete; rolls up to phase + milestone.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = checkOrigin(req);
  if (origin) return origin;
  const guard = await requireEditor();
  if ("res" in guard) return guard.res;

  const { id } = await params;
  const taskId = Number(id);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const state = (body as { state?: unknown })?.state;
  const pct = (body as { pct?: unknown })?.pct;

  try {
    // State change (ACTIVE / BLOCKED / ON_HOLD)
    if (typeof state === "string") {
      const result = await setTaskState(taskId, state);
      const label = state === "BLOCKED" ? "marked blocked" : state === "ON_HOLD" ? "put on hold" : "resumed";
      await logActivity({ actor: guard.user.name, verb: label, target: result.desc, taskId });
      revalidatePath("/dashboard");
      revalidatePath(`/task/${taskId}`);
      return NextResponse.json({ ok: true, ...result });
    }
    // Progress change
    if (typeof pct === "number" && Number.isFinite(pct) && pct >= 0 && pct <= 100) {
      const result = await updateTaskProgress(taskId, pct);
      await logActivity({
        actor: guard.user.name,
        verb: result.pct >= 100 ? "completed" : "updated progress on",
        target: result.desc,
        detail: result.pct >= 100 ? undefined : `to ${result.pct}%`,
        taskId,
      });
      revalidatePath("/dashboard");
      revalidatePath(`/task/${taskId}`);
      return NextResponse.json({ ok: true, ...result });
    }
    return NextResponse.json({ error: "Body must include { pct: 0–100 } or { state }" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    const status = msg.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
