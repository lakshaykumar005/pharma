import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { setApproval } from "@/app/lib/mutations";
import { logActivity } from "@/app/lib/activity";
import { notifyClientDecision } from "@/app/lib/email";
import { checkOrigin, requireAuth } from "@/app/lib/api-guard";

export const dynamic = "force-dynamic";

// POST /api/tasks/:id/approval — client sign-off. body: { approval, note? }.
// Reserved for the client (VIEWER); the manager (ADMIN) may record it too.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = checkOrigin(req);
  if (origin) return origin;
  const guard = await requireAuth();
  if ("res" in guard) return guard.res;
  if (guard.user.role !== "VIEWER" && guard.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — client sign-off only" }, { status: 403 });
  }

  const { id } = await params;
  const taskId = Number(id);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const approval = (body as { approval?: unknown })?.approval;
  const note = typeof (body as { note?: unknown })?.note === "string" ? (body as { note: string }).note : "";
  if (approval !== "APPROVED" && approval !== "CHANGES" && approval !== null) {
    return NextResponse.json({ error: "approval must be APPROVED, CHANGES or null" }, { status: 400 });
  }

  try {
    const result = await setApproval(taskId, approval, guard.user.name, note);
    const verb =
      approval === "APPROVED" ? "approved" : approval === "CHANGES" ? "requested changes on" : "cleared sign-off on";
    await logActivity({ actor: guard.user.name, verb, target: result.desc, taskId });
    if (approval === "APPROVED" || approval === "CHANGES") {
      await notifyClientDecision(result.owner, result.desc, approval, note);
    }
    revalidatePath(`/task/${taskId}`);
    revalidatePath("/dashboard");
    revalidatePath("/alerts");
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sign-off failed";
    return NextResponse.json({ error: msg }, { status: msg.includes("not found") ? 404 : 400 });
  }
}
