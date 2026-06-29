import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/app/lib/auth";
import { getProject, getPhases } from "@/app/lib/queries";
import { DEPARTMENT_NAMES, type RoleCode } from "@/app/lib/types";
import {
  fmtLong,
  fmtShort,
  daysBetween,
  overallProgress,
  tasksDone,
  tasksTotal,
} from "@/app/lib/helpers";
import { ProgressRing } from "@/app/components/ProgressRing";
import { RoleBadge } from "@/app/components/RoleBadge";
import { StatusBoard } from "@/app/components/StatusBoard";
import { Timeline } from "@/app/components/Timeline";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return { title: `${decodeURIComponent(code)} — Command Center` };
}

export default async function PhasePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const decoded = decodeURIComponent(code).toUpperCase();
  await requireUser(`/phase/${code}`);

  const [project, phases] = await Promise.all([getProject(), getPhases()]);
  const phase = phases.find((p) => p.code.toUpperCase() === decoded);
  if (!phase) notFound();

  const work = phase.tasks.filter((t) => t.type === "T");
  const milestone = phase.tasks.find((t) => t.type === "M");
  const done = tasksDone(phase.tasks);
  const total = tasksTotal(phase.tasks);
  const pct = overallProgress(phase.tasks);
  const daysToTarget = daysBetween(project.asOf, phase.end);

  // departments contributing to this phase, with their owners
  const byDept = new Map<RoleCode, Set<string>>();
  for (const t of work) {
    if (!byDept.has(t.role)) byDept.set(t.role, new Set());
    if (t.owner && t.owner !== "Unassigned") byDept.get(t.role)!.add(t.owner);
  }

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      {/* breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 font-mono text-[0.66rem] uppercase tracking-widest text-faint">
        <Link href="/dashboard" className="hover:text-ink">Command Center</Link>
        <span>/</span>
        <Link href="/dashboard#workstreams" className="hover:text-ink">Workstreams</Link>
        <span>/</span>
        <span className="text-brand-bright">{phase.code}</span>
      </nav>

      {/* header */}
      <header className="mt-6 card overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-brand-deep via-brand to-brand-bright" />
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="chip border-brand/40 text-brand-bright">{phase.code} · Workstream</span>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              {phase.name}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-mute">
              <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-brand" />
              Milestone · {phase.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-5 lg:flex-col lg:items-end">
            <ProgressRing value={pct} size={120} stroke={10} label="complete" />
          </div>
        </div>
      </header>

      {/* key facts */}
      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact label="Window" value={`${fmtShort(phase.start)} – ${fmtShort(phase.end)}`} />
        <Fact label="Tasks done" value={`${done} / ${total}`} />
        <Fact label="Target" value={fmtLong(phase.end)} />
        <Fact
          label={daysToTarget < 0 ? "Overdue by" : "Days to target"}
          value={daysToTarget < 0 ? `${-daysToTarget}d` : `${daysToTarget}d`}
          accent={daysToTarget < 0}
        />
      </section>

      {/* plan board for this phase */}
      <section className="mt-10">
        <div className="max-w-2xl">
          <span className="mono-label text-brand-bright">Phase plan</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Done, doing &amp; up next</h2>
          <p className="mt-2 text-sm text-mute">Every task in {phase.code}, bucketed by where it stands.</p>
        </div>
        <div className="mt-6">
          <StatusBoard tasks={phase.tasks} asOf={project.asOf} />
        </div>
      </section>

      {/* mini timeline for this phase */}
      <section className="mt-12">
        <div className="max-w-2xl">
          <span className="mono-label text-brand-bright">Phase timeline</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Schedule at a glance</h2>
        </div>
        <div className="mt-6">
          <Timeline phases={[phase]} project={project} />
        </div>
      </section>

      {/* departments + milestone */}
      <section className="mt-12 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <p className="mono-label">Departments on this line</p>
          <ul className="mt-4 space-y-3">
            {[...byDept.entries()].map(([dept, owners]) => (
              <li key={dept} className="flex items-start gap-3">
                <RoleBadge code={dept} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{DEPARTMENT_NAMES[dept]}</p>
                  <p className="text-xs text-mute">{[...owners].join(", ") || "Unassigned"}</p>
                </div>
              </li>
            ))}
            {byDept.size === 0 && <li className="text-sm text-faint">No work tasks yet.</li>}
          </ul>
        </div>

        <div className="card p-6">
          <p className="mono-label">Closing milestone</p>
          {milestone ? (
            <Link
              href={`/task/${milestone.id}`}
              className="mt-4 flex items-center gap-3 rounded-xl border border-black/8 bg-black/[0.02] p-4 transition-colors hover:border-brand/40"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10">
                <span className="h-3 w-3 rotate-45 rounded-[2px] bg-brand" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{phase.subtitle}</span>
                <span className="block text-xs text-mute">Target {fmtLong(phase.end)}</span>
              </span>
              <span className="font-mono text-xs text-faint">{milestone.pct}%</span>
            </Link>
          ) : (
            <p className="mt-4 text-sm text-faint">No milestone defined for this phase.</p>
          )}
        </div>
      </section>

      <div className="mt-10">
        <Link href="/dashboard#workstreams" className="mono-label inline-flex items-center gap-2 text-brand-bright hover:text-ink">
          <span aria-hidden>←</span> Back to all workstreams
        </Link>
      </div>
    </div>
  );
}

function Fact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card p-4">
      <p className="mono-label text-[0.55rem]">{label}</p>
      <p className={`mt-2 truncate text-sm font-semibold ${accent ? "text-brand" : "text-ink"}`} title={value}>
        {value}
      </p>
    </div>
  );
}
