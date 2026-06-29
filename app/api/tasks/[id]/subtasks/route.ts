import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { addSubtask } from "@/app/lib/mutations";
import { logActivity } from "@/app/lib/activity";
import { checkOrigin, requireTaskEditor } from "@/app/lib/api-guard";

export const dynamic = "force-dynamic";

// POST /api/tasks/:id/subtasks — add a subtask (editor/admin).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = checkOrigin(req);
  if (origin) return origin;

  const { id } = await params;
  const guard = await requireTaskEditor(Number(id));
  if ("res" in guard) return guard.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const title = (body as { title?: unknown })?.title;
  const assignee = typeof (body as { assignee?: unknown })?.assignee === "string" ? (body as { assignee: string }).assignee : null;
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Body must include a non-empty { title }" }, { status: 400 });
  }

  try {
    const result = await addSubtask(Number(id), title, assignee);
    await logActivity({
      actor: guard.user.name,
      verb: "added subtask",
      target: result.subtask.title,
      taskId: Number(id),
    });
    revalidatePath(`/task/${id}`);
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to add subtask";
    return NextResponse.json({ error: msg }, { status: msg.includes("not found") ? 404 : 400 });
  }
}
