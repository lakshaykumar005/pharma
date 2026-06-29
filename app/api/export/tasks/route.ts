import { getAllTasks, getProject } from "@/app/lib/queries";
import { statusOf } from "@/app/lib/helpers";
import { requireAuth } from "@/app/lib/api-guard";

export const dynamic = "force-dynamic";

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/export/tasks — programme task list as a CSV download.
export async function GET() {
  const guard = await requireAuth();
  if ("res" in guard) return guard.res;

  const [project, tasks] = await Promise.all([getProject(), getAllTasks()]);
  const headers = ["ID", "Phase", "Type", "Description", "Department", "Owner", "Start", "End", "Work days", "Percent", "Status", "Client sign-off"];
  const signoff = (t: (typeof tasks)[number]) =>
    t.approval === "APPROVED" ? "Approved" : t.approval === "CHANGES" ? "Changes requested" : t.pct >= 100 || t.type === "M" ? "Awaiting" : "";
  const rows = tasks.map((t) => [
    t.id,
    t.phaseCode,
    t.type === "M" ? "Milestone" : "Task",
    t.desc,
    t.role,
    t.owner,
    t.start,
    t.end,
    t.workDays,
    t.pct,
    statusOf(t, project.asOf),
    signoff(t),
  ]);
  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="anthem-programme-${project.asOf}.csv"`,
    },
  });
}
