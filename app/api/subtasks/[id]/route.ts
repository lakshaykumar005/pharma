import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { setSubtaskDone, deleteSubtask } from "@/app/lib/mutations";
import { logActivity } from "@/app/lib/activity";
import { checkOrigin, requireEditor } from "@/app/lib/api-guard";

export const dynamic = "force-dynamic";

// PATCH /api/subtasks/:id — toggle done (editor/admin).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = checkOrigin(req);
  if (origin) return origin;
  const guard = await requireEditor();
  if ("res" in guard) return guard.res;

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const done = (body as { done?: unknown })?.done;
  if (typeof done !== "boolean") {
    return NextResponse.json({ error: "Body must include { done: boolean }" }, { status: 400 });
  }

  try {
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
  const guard = await requireEditor();
  if ("res" in guard) return guard.res;

  const { id } = await params;
  try {
    const result = await deleteSubtask(Number(id));
    revalidatePath(`/task/${result.taskId}`);
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete subtask";
    return NextResponse.json({ error: msg }, { status: msg.includes("not found") ? 404 : 400 });
  }
}
