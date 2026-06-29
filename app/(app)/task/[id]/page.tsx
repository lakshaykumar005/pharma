import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, canEdit } from "@/app/lib/auth";
import { getTaskDetail, getProject } from "@/app/lib/queries";
import { type Task } from "@/app/lib/types";
import { fmtLong, fmtShort, statusOf } from "@/app/lib/helpers";
import { ProgressRing } from "@/app/components/ProgressRing";
import { RoleBadge } from "@/app/components/RoleBadge";
import { StatusBadge } from "@/app/components/StatusBadge";
import { ProgressControl } from "@/app/components/ProgressControl";
import { Subtasks } from "@/app/components/Subtasks";
import { Comments } from "@/app/components/Comments";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getTaskDetail(Number(id));
  return { title: detail ? `${detail.task.desc} — Command Center` : "Task — Command Center" };
}

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/task/${id}`);
  const [detail, project] = await Promise.all([getTaskDetail(Number(id)), getProject()]);
  if (!detail) notFound();

  const { task, phase, dept, predecessors, successors, prev, next } = detail;
  const status = statusOf(task, project.asOf);
  const isMilestone = task.type === "M";
  const hasSubtasks = task.subtasks.length > 0;
  const onBaseline = task.start === task.baselineStart && task.end === task.baselineEnd;
  const cleanDesc = task.desc.replace(/^Milestone-\d+ · /, "");

  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-8 sm:px-6 sm:pt-12">
      {/* breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 font-mono text-[0.66rem] uppercase tracking-widest text-faint">
        <Link href="/dashboard" className="hover:text-ink">
          Command Center
        </Link>
        <span>/</span>
        <Link href="/dashboard#workstreams" className="hover:text-ink">
          {phase.code} {phase.name}
        </Link>
        <span>/</span>
        <span className="text-brand-bright">Task {task.id}</span>
      </nav>

      {/* header */}
      <header className="mt-6 card overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-brand-deep via-brand to-brand-bright" />
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip border-brand/40 text-brand-bright">{phase.code}</span>
              {isMilestone && (
                <span className="chip border-black/15 text-ink">
                  <span className="h-2 w-2 rotate-45 rounded-[1px] bg-brand" /> Milestone
                </span>
              )}
              {task.critical && (
                <span className="chip border-brand/50 bg-brand/10 text-brand-bright">
                  ⚠ Critical path
                </span>
              )}
              <StatusBadge status={status} />
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              {cleanDesc}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-mute">
              <RoleBadge code={task.role} size="md" /> {dept.name} · {phase.name}
            </p>
          </div>

          <div className="flex items-center gap-5 lg:flex-col lg:items-end">
            <ProgressRing value={task.pct} size={120} stroke={10} label="complete" />
          </div>
        </div>
      </header>

      {/* key facts */}
      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact label="Owner" value={task.owner} />
        <Fact label="Department" value={dept.name} />
        <Fact label="Work days" value={isMilestone ? "—" : `${task.workDays}`} />
        <Fact label="Dependency" value={task.depType === "FF" ? "Finish-to-Finish" : "Finish-to-Start"} />
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* schedule + live progress */}
        <div className="card p-6">
          <p className="mono-label">Schedule</p>
          <div className="mt-5 grid grid-cols-2 gap-5">
            <DateBlock label="Planned start" value={fmtLong(task.start)} />
            <DateBlock label="Planned finish" value={fmtLong(task.end)} />
          </div>

          {/* editable progress — writes to the database (editors/admins only) */}
          <ProgressControl
            taskId={task.id}
            initialPct={task.pct}
            readOnly={isMilestone || hasSubtasks || !canEdit(user.role)}
            readOnlyNote={
              isMilestone
                ? "Rolled up from this line's tasks — not directly editable."
                : hasSubtasks
                  ? "Progress is driven by the subtask checklist below."
                  : "View-only access. Sign in as an editor to update progress."
            }
          />

          {/* baseline note */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-black/8 bg-black/[0.02] p-4">
            <span
              className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                onBaseline ? "bg-brand/15 text-brand-bright" : "bg-brand text-white"
              }`}
            >
              {onBaseline ? "✓" : "!"}
            </span>
            <p className="text-sm leading-relaxed text-mute">
              {onBaseline ? (
                <>
                  <span className="text-ink">On baseline.</span> Actual plan matches the base plan
                  for this task — no schedule slippage recorded as of {fmtShort(project.asOf)}.
                </>
              ) : (
                <>
                  <span className="text-ink">Off baseline.</span> Baseline was{" "}
                  {fmtShort(task.baselineStart)}–{fmtShort(task.baselineEnd)}; now planned{" "}
                  {fmtShort(task.start)}–{fmtShort(task.end)}.
                </>
              )}
            </p>
          </div>
        </div>

        {/* owner + dependencies */}
        <div className="flex flex-col gap-5">
          <div className="card p-6">
            <p className="mono-label">Accountable</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-black/10 font-display text-xl text-ink">
                {task.owner
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div>
                <p className="text-base font-semibold text-ink">{task.owner}</p>
                <p className="text-xs text-mute">{dept.name} department</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-faint">{dept.desc}</p>
          </div>

          <div className="card flex-1 p-6">
            <p className="mono-label">Dependencies</p>
            <DepGroup title="Waits on" items={predecessors} empty="Starts the chain — no predecessor." />
            <DepGroup title="Unblocks" items={successors} empty="No downstream task — chain endpoint." />
          </div>
        </div>
      </div>

      {/* subtasks (only for tasks, not milestones) */}
      {!isMilestone && (
        <div className="mt-5">
          <Subtasks taskId={task.id} initial={task.subtasks} canEdit={canEdit(user.role)} />
        </div>
      )}

      {/* discussion */}
      <div className="mt-5">
        <Comments
          taskId={task.id}
          initial={detail.comments}
          canComment={canEdit(user.role)}
          meName={user.name}
          meRole={user.role}
        />
      </div>

      {/* prev / next */}
      <nav className="mt-8 grid gap-3 sm:grid-cols-2">
        <NavCard task={prev} dir="prev" />
        <NavCard task={next} dir="next" />
      </nav>

      <div className="mt-10 mb-4">
        <Link href="/dashboard#timeline" className="mono-label inline-flex items-center gap-2 text-brand-bright hover:text-white">
          <span aria-hidden>←</span> Back to programme timeline
        </Link>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="mono-label text-[0.55rem]">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-ink" title={value}>
        {value}
      </p>
    </div>
  );
}

function DateBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mono-label text-[0.55rem]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function DepGroup({ title, items, empty }: { title: string; items: Task[]; empty: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-faint">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-mute">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((t) => (
            <li key={t.id}>
              <Link
                href={`/task/${t.id}`}
                className="group flex items-center gap-3 rounded-lg border border-black/8 bg-black/[0.02] px-3 py-2.5 transition-colors hover:border-brand/40 hover:bg-black/[0.04]"
              >
                <RoleBadge code={t.role} />
                <span className="min-w-0 flex-1 truncate text-sm text-ink/90 group-hover:text-ink">
                  {t.desc.replace(/^Milestone-\d+ · /, "◆ ")}
                </span>
                <span className="font-mono text-[0.6rem] text-faint">{t.pct}%</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NavCard({ task, dir }: { task: Task | null; dir: "prev" | "next" }) {
  if (!task) return <span className="hidden sm:block" />;
  return (
    <Link
      href={`/task/${task.id}`}
      className={`card card-hover flex items-center gap-3 p-4 ${dir === "next" ? "sm:flex-row-reverse sm:text-right" : ""}`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 text-brand-bright">
        {dir === "prev" ? "←" : "→"}
      </span>
      <span className="min-w-0">
        <span className="mono-label block text-[0.55rem]">{dir === "prev" ? "Previous" : "Next"}</span>
        <span className="block truncate text-sm font-medium text-ink">
          {task.desc.replace(/^Milestone-\d+ · /, "◆ ")}
        </span>
      </span>
    </Link>
  );
}
