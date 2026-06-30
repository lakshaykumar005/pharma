import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { setSubtaskDone, deleteSubtask, setSubtaskAssignee } from "@/app/lib/mutations";
import { logActivity } from "@/app/lib/activity";
import { checkOrigin, requireSubtaskEditor } from "@/app/lib/api-guard";

export const dynamic = "force-dynamic";

// PATCH /api/subtasks/:id — toggle done (editor/admin).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = checkOrigin(req);
  if (origin) return origin;

  const { id } = await params;
  const guard = await requireSubtaskEditor(Number(id));
  if ("res" in guard) return guard.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const done = (body as { done?: unknown })?.done;
  const hasAssignee = body !== null && typeof body === "object" && "assignee" in body;

  try {
    // Assignee change — who's working on this subtask
    if (hasAssignee) {
      const raw = (body as { assignee?: unknown }).assignee;
      const assignee = typeof raw === "string" ? raw : null;
      const result = await setSubtaskAssignee(Number(id), assignee);
      await logActivity({
        actor: guard.user.name,
        verb: assignee ? "assigned subtask" : "unassigned subtask",
        target: result.title,
        detail: assignee ? `to ${assignee}` : undefined,
        taskId: result.taskId,
      });
      revalidatePath(`/task/${result.taskId}`);
      revalidatePath("/assignments");
      return NextResponse.json({ ok: true, ...result });
    }
    // Done toggle
    if (typeof done !== "boolean") {
      return NextResponse.json({ error: "Body must include { done: boolean } or { assignee }" }, { status: 400 });
    }
    const result = await setSubtaskDone(Number(id), done);
    await logActivity({
      actor: guard.user.name,
      verb: result.done ? "checked off" : "reopened",
      target: result.title,
      taskId: result.taskId,
    });
    revalidatePath(`/task/${result.taskId}`);
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update subtask";
    return NextResponse.json({ error: msg }, { status: msg.includes("not found") ? 404 : 400 });
  }
}

// DELETE /api/subtasks/:id — remove a subtask (editor/admin).
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = checkOrigin(req);
  if (origin) return origin;

  const { id } = await params;
  const guard = await requireSubtaskEditor(Number(id));
  if ("res" in guard) return guard.res;

  try {
    const result = await deleteSubtask(Number(id));
    await logActivity({
      actor: guard.user.name,
      verb: "removed subtask",
      target: result.title,
      taskId: result.taskId,
    });
    revalidatePath(`/task/${result.taskId}`);
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete subtask";
    return NextResponse.json({ error: msg }, { status: msg.includes("not found") ? 404 : 400 });
  }
}
