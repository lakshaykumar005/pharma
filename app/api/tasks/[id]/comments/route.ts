import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { addComment } from "@/app/lib/mutations";
import { logActivity } from "@/app/lib/activity";
import { checkOrigin, requireEditor } from "@/app/lib/api-guard";

export const dynamic = "force-dynamic";

// POST /api/tasks/:id/comments — add a comment (managers + engineers).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const text = (body as { body?: unknown })?.body;
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Comment can't be empty" }, { status: 400 });
  }

  try {
    const result = await addComment(taskId, guard.user.name, guard.user.role, text);
    await logActivity({ actor: guard.user.name, verb: "commented on", target: result.taskDesc, taskId });
    revalidatePath(`/task/${taskId}`);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to add comment";
    return NextResponse.json({ error: msg }, { status: msg.includes("not found") ? 404 : 400 });
  }
}
