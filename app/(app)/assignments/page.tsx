import Link from "next/link";
import { requireUser } from "@/app/lib/auth";
import { getProject, getAllTasks, getTeam } from "@/app/lib/queries";
import { DEPARTMENT_NAMES, type Task } from "@/app/lib/types";
import { statusOf } from "@/app/lib/helpers";
import { RoleBadge } from "@/app/components/RoleBadge";
import { StatusBadge } from "@/app/components/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Who's on what — Command Center" };

const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

type SubRef = { id: number; title: string; done: boolean; taskId: number; taskDesc: string };

export default async function AssignmentsPage() {
  await requireUser("/assignments");
  const [project, team, all] = await Promise.all([getProject(), getTeam(), getAllTasks()]);
  const realTasks = all.filter((t) => t.type === "T");

  // subtasks assigned to a person, with their parent task — "who's on which subtask"
  const subsByPerson = (name: string): SubRef[] =>
    all.flatMap((t) => t.subtasks.filter((s) => s.assignee === name).map((s) => ({ id: s.id, title: s.title, done: s.done, taskId: t.id, taskDesc: t.desc })));

  const unassigned = realTasks.filter((t) => !t.owner || t.owner === "Unassigned");

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <header>
        <span className="mono-label text-brand-bright">Team · assignments</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Who&apos;s on what</h1>
        <p className="mt-2 text-sm text-mute">
          Every team member with the tasks they own and the subtasks assigned to them — so it&apos;s always clear who is working on what.
        </p>
      </header>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {team.map((m) => {
          const tasks = realTasks.filter((t) => t.owner === m.name);
          const subs = subsByPerson(m.name);
          const doneCount = tasks.filter((t) => t.pct >= 100).length;
          const inProgress = tasks.filter((t) => t.pct > 0 && t.pct < 100).length;
          return (
            <article key={m.name} className="card flex flex-col p-6">
              {/* person header */}
              <div className="flex items-center gap-3 border-b border-black/8 pb-4">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-lg ${m.lead ? "bg-brand text-white" : "bg-black/10 text-ink"}`}>
                  {initials(m.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {m.name}
                    {m.lead && <span className="text-brand"> · Lead</span>}
                  </p>
                  <p className="truncate text-xs text-mute">{m.title} · {DEPARTMENT_NAMES[m.role]}</p>
                </div>
                <RoleBadge code={m.role} />
              </div>

              {/* tally */}
              <div className="mt-3 flex items-center gap-4 text-xs text-mute">
                <span><span className="font-mono text-sm text-ink">{tasks.length}</span> task{tasks.length === 1 ? "" : "s"}</span>
                <span><span className="font-mono text-sm text-brand-bright">{inProgress}</span> in progress</span>
                <span><span className="font-mono text-sm text-ink">{doneCount}</span> done</span>
                {subs.length > 0 && <span className="ml-auto"><span className="font-mono text-sm text-ink">{subs.length}</span> subtask{subs.length === 1 ? "" : "s"}</span>}
              </div>

              {/* owned tasks */}
              <ul className="mt-3 space-y-1.5">
                {tasks.map((t) => (
                  <li key={t.id}>
                    <Link href={`/task/${t.id}`} className="group flex items-center gap-2.5 rounded-lg border border-black/8 bg-black/[0.015] px-3 py-2 transition-colors hover:border-brand/40 hover:bg-black/[0.03]">
                      <RoleBadge code={t.role} />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink/90 group-hover:text-ink">{t.desc}</span>
                      {t.subtasks.length > 0 && (
                        <span className="shrink-0 font-mono text-[0.58rem] text-faint">☑ {t.subtasks.filter((s) => s.done).length}/{t.subtasks.length}</span>
                      )}
                      <span className="shrink-0 font-mono text-[0.62rem] text-faint">{t.pct}%</span>
                      <StatusBadge status={statusOf(t, project.asOf)} />
                    </Link>
                  </li>
                ))}
                {tasks.length === 0 && (
                  <li className="rounded-lg border border-dashed border-black/10 px-3 py-3 text-center text-xs text-faint">No tasks owned.</li>
                )}
              </ul>

              {/* subtasks they're on (across any task) */}
              {subs.length > 0 && (
                <div className="mt-4">
                  <p className="mono-label text-[0.52rem]">Subtasks assigned</p>
                  <ul className="mt-2 space-y-1">
                    {subs.map((s) => (
                      <li key={s.id} className="flex items-center gap-2 text-xs">
                        <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border ${s.done ? "border-brand bg-brand text-white" : "border-black/25"}`}>
                          {s.done && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>}
                        </span>
                        <span className={`truncate ${s.done ? "text-faint line-through" : "text-ink/90"}`}>{s.title}</span>
                        <Link href={`/task/${s.taskId}`} className="ml-auto shrink-0 truncate font-mono text-[0.55rem] text-faint hover:text-brand-bright" title={s.taskDesc}>
                          {s.taskDesc.length > 22 ? s.taskDesc.slice(0, 22) + "…" : s.taskDesc}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}

        {/* unassigned tasks */}
        {unassigned.length > 0 && (
          <article className="card flex flex-col border-dashed p-6">
            <div className="flex items-center gap-3 border-b border-black/8 pb-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/[0.06] font-display text-lg text-faint">?</span>
              <div>
                <p className="text-sm font-semibold text-ink">Unassigned</p>
                <p className="text-xs text-mute">Needs an owner</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {unassigned.map((t) => (
                <li key={t.id}>
                  <Link href={`/task/${t.id}`} className="group flex items-center gap-2.5 rounded-lg border border-black/8 bg-black/[0.015] px-3 py-2 transition-colors hover:border-brand/40">
                    <RoleBadge code={t.role} />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink/90">{t.desc}</span>
                    <StatusBadge status={statusOf(t, project.asOf)} />
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        )}
      </div>
    </div>
  );
}
