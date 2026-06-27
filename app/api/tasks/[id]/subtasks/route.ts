import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { addSubtask } from "@/app/lib/mutations";
import { checkOrigin, requireEditor } from "@/app/lib/api-guard";

export const dynamic = "force-dynamic";

// POST /api/tasks/:id/subtasks — add a subtask (editor/admin).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const title = (body as { title?: unknown })?.title;
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Body must include a non-empty { title }" }, { status: 400 });
  }

  try {
    const result = await addSubtask(Number(id), title);
    revalidatePath(`/task/${id}`);
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to add subtask";
    return NextResponse.json({ error: msg }, { status: msg.includes("not found") ? 404 : 400 });
  }
}
