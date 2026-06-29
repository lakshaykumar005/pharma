import { redirect } from "next/navigation";
import { requireUser, canEdit, roleLabel } from "@/app/lib/auth";
import { getProject, getAllTasks } from "@/app/lib/queries";
import { StatusBoard } from "@/app/components/StatusBoard";
import { ProgressRing } from "@/app/components/ProgressRing";
import { overallProgress } from "@/app/lib/helpers";
import { DEPARTMENT_NAMES } from "@/app/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "My work — Command Center" };

export default async function MyTasksPage() {
  const user = await requireUser("/my-tasks");
  if (!canEdit(user.role)) redirect("/dashboard"); // clients have no assignments

  const [project, all] = await Promise.all([getProject(), getAllTasks()]);
  // Everything this engineer can act on: assigned to them OR in their department.
  const mine = all.filter(
    (t) =>
      t.type === "T" &&
      (t.owner === user.name || (!!user.department && t.role === user.department)),
  );
  const deptName = user.department ? DEPARTMENT_NAMES[user.department] : null;
  const done = mine.filter((t) => t.pct >= 100).length;
  const pct = overallProgress(mine);

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="mono-label text-brand-bright">
            {roleLabel(user.role)}
            {deptName ? ` · ${deptName}` : ""} · {user.name}
          </span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">My work</h1>
          <p className="mt-2 text-sm text-mute">
            {mine.length
              ? `${mine.length} task${mine.length === 1 ? "" : "s"} you own or ${deptName ? `in ${deptName}` : "in your department"} · ${done} done`
              : "Nothing is assigned to you yet."}
          </p>
        </div>
        {mine.length > 0 && (
          <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-black/8 bg-black/[0.02] px-5 py-4">
            <ProgressRing value={pct} size={64} stroke={6} />
            <div>
              <p className="mono-label text-[0.55rem]">My completion</p>
              <p className="text-xs text-mute">weighted across your tasks</p>
            </div>
          </div>
        )}
      </header>

      {mine.length > 0 ? (
        <div className="mt-10">
          <StatusBoard tasks={mine} asOf={project.asOf} />
        </div>
      ) : (
        <div className="card mt-8 p-10 text-center text-sm text-faint">
          No tasks are assigned to <span className="text-ink">{user.name}</span> yet. A manager can
          assign tasks to you from the Manage console.
        </div>
      )}
    </div>
  );
}
