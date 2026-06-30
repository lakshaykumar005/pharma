import { requireUser, roleLabel } from "@/app/lib/auth";
import { getProject, getSnapshot } from "@/app/lib/queries";
import { type RoleCode } from "@/app/lib/types";
import { TasksExplorer } from "@/app/components/TasksExplorer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tasks — Command Center" };

export default async function TasksPage() {
  const user = await requireUser("/tasks");
  const [project, { phases, departments, team }] = await Promise.all([getProject(), getSnapshot()]);

  // every work task across all phases (milestones live on the timeline)
  const tasks = phases.flatMap((p) => p.tasks).filter((t) => t.type === "T");

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <header>
        <span className="mono-label text-brand-bright">{roleLabel(user.role)} · all tasks</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Tasks</h1>
        <p className="mt-2 text-sm text-mute">
          Every task across the programme — search, filter by phase, department or owner, and open any task
          for its full profile.
        </p>
      </header>

      <div className="mt-8">
        <TasksExplorer
          tasks={tasks}
          phases={phases.map((p) => ({ code: p.code, name: p.name }))}
          departments={departments.map((d) => ({ code: d.code, name: d.name }))}
          owners={[...new Set(team.map((m) => m.name))]}
          asOf={project.asOf}
          role={user.role}
          name={user.name}
          department={(user.department as RoleCode) ?? null}
        />
      </div>
    </div>
  );
}
