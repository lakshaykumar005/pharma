import Link from "next/link";
import { getSnapshot } from "@/app/lib/queries";
import { getActivity, type ActivityRow } from "@/app/lib/activity";
import { type ProjectMeta, type Phase, type Department, type Member, type Task } from "@/app/lib/types";
import {
  daysToGo,
  programmeDay,
  totalDays,
  overallProgress,
  tasksDone,
  tasksActive,
  tasksTotal,
  fmtLong,
  fmtShort,
} from "@/app/lib/helpers";
import { Reveal } from "@/app/components/Reveal";
import { ProgressRing } from "@/app/components/ProgressRing";
import { WorkstreamCard } from "@/app/components/WorkstreamCard";
import { Timeline } from "@/app/components/Timeline";
import { RoleBadge } from "@/app/components/RoleBadge";
import { SpotlightCard } from "@/app/components/ui/SpotlightCard";
import { NumberTicker } from "@/app/components/ui/NumberTicker";
import { TiltCard } from "@/app/components/ui/TiltCard";
import { StatusBoard } from "@/app/components/StatusBoard";
import { ActivityFeed } from "@/app/components/ActivityFeed";

// Always render from the live database — no static snapshot.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [{ project, phases, departments, team }, activity] = await Promise.all([
    getSnapshot(),
    getActivity(14),
  ]);
  const allTasks = phases.flatMap((p) => p.tasks);

  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
      <Hero project={project} tasks={allTasks} />
      <PlanSection tasks={allTasks} asOf={project.asOf} />
      <Workstreams phases={phases} asOf={project.asOf} />
      <TimelineSection phases={phases} project={project} />
      <TeamSection departments={departments} team={team} />
      <ActivitySection activity={activity} />
    </div>
  );
}

/* ------------------------------- HERO ------------------------------------ */

function Hero({ project, tasks }: { project: ProjectMeta; tasks: Task[] }) {
  const overall = overallProgress(tasks);
  return (
    <section id="overview" className="scroll-mt-24 pt-10 sm:pt-16">
      <Reveal>
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip border-brand/40 text-brand-bright">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-bright" />
            {project.programme}
          </span>
          <span className="chip">Priority · {project.priority}</span>
          <span className="chip">Lead · {project.lead}</span>
          <span className="ml-auto font-mono text-[0.66rem] uppercase tracking-widest text-faint">
            As of {fmtLong(project.asOf)}
          </span>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <h1 className="mt-7 font-display text-[clamp(2.8rem,9vw,6.5rem)] uppercase leading-[0.85] tracking-tight text-ink">
          Three lines.
          <br />
          One <span className="text-brand">commissioned</span> system.
        </h1>
      </Reveal>

      <Reveal delay={120}>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-mute sm:text-lg">
          Live command center for the <strong className="text-ink">{project.client}</strong> effluent
          treatment plant demonstration — tracking procurement, delivery, installation and
          commissioning across three parallel engineering lines toward the{" "}
          <strong className="text-ink">{fmtShort(project.end)}</strong> target close.
        </p>
      </Reveal>

      {/* KPI strip */}
      <Reveal delay={160}>
        <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Days to go" sub={`to ${fmtShort(project.end)}`}>
            <NumberTicker value={daysToGo(project)} />
          </Kpi>
          <Kpi label="Programme day" sub={`of ${totalDays(project)} days`}>
            <NumberTicker value={programmeDay(project)} />
          </Kpi>
          {/* featured white tile */}
          <div className="group relative col-span-2 flex items-center justify-between gap-4 overflow-hidden rounded-[var(--radius-card)] bg-paper p-5 text-paper-ink shadow-[0_24px_60px_-30px_rgba(236,28,43,0.6)] lg:col-span-1">
            <div className="relative z-10">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-zinc-500">
                Overall progress
              </p>
              <p className="display-num mt-2 text-5xl text-paper-ink">
                <NumberTicker value={overall} />
                <span className="text-2xl text-zinc-600">%</span>
              </p>
              <p className="mt-1 text-[0.7rem] text-zinc-500">weighted · 3 lines</p>
            </div>
            <ProgressRing value={overall} size={72} stroke={7} />
          </div>
          <Kpi label="Target close" value={fmtShort(project.end)} sub="Demo-trial live" accent />
        </div>
      </Reveal>

      {/* quick task tally */}
      <Reveal delay={200}>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[var(--radius-card)] border border-black/8 bg-black/[0.015] px-5 py-3 text-sm">
          <Tally n={tasksDone(tasks)} label="completed" tone="ink" />
          <span className="h-4 w-px bg-black/10" />
          <Tally n={tasksActive(tasks)} label="in progress" tone="brand" />
          <span className="h-4 w-px bg-black/10" />
          <Tally n={tasksTotal(tasks) - tasksDone(tasks) - tasksActive(tasks)} label="upcoming" tone="mute" />
          <span className="ml-auto font-mono text-[0.66rem] uppercase tracking-widest text-faint">
            {project.workWeek}
          </span>
        </div>
      </Reveal>
    </section>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
  children,
}: {
  label: string;
  value?: string;
  sub: string;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <SpotlightCard className="card card-hover h-full">
      <div className="flex h-full flex-col justify-between p-5">
        <p className="mono-label">{label}</p>
        <p className={`display-num mt-6 text-5xl ${accent ? "text-brand" : "text-ink"}`}>
          {children ?? value}
        </p>
        <p className="mt-1 text-[0.7rem] text-faint">{sub}</p>
      </div>
    </SpotlightCard>
  );
}

function Tally({ n, label, tone }: { n: number; label: string; tone: "ink" | "brand" | "mute" }) {
  const color = tone === "brand" ? "text-brand-bright" : tone === "mute" ? "text-mute" : "text-ink";
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={`display-num text-2xl ${color}`}>
        <NumberTicker value={n} />
      </span>
      <span className="text-mute">{label}</span>
    </span>
  );
}

/* ----------------------------- PLAN / STATUS ----------------------------- */

function PlanSection({ tasks, asOf }: { tasks: Task[]; asOf: string }) {
  return (
    <section id="plan" className="scroll-mt-24 pt-20">
      <SectionHead
        kicker="01 · Plan & progress"
        title="Done, doing & up next"
        desc="Every task bucketed by where it stands — with owners and deadlines — so you always know what's been delivered, what's in motion, and what's coming."
      />
      <Reveal>
        <div className="mt-10">
          <StatusBoard tasks={tasks} asOf={asOf} />
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------- WORKSTREAMS --------------------------------- */

function Workstreams({ phases, asOf }: { phases: Phase[]; asOf: string }) {
  return (
    <section id="workstreams" className="scroll-mt-24 pt-20">
      <SectionHead
        kicker="02 · Workstreams"
        title="The three engineering lines"
        desc="Each line runs procurement → delivery → installation → commissioning to its own milestone. Open any task for its full profile."
      />
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {phases.map((p, i) => (
          <Reveal key={p.code} delay={i * 90}>
            <TiltCard className="h-full" max={6}>
              <WorkstreamCard phase={p} index={i} asOf={asOf} />
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- TIMELINE ----------------------------------- */

function TimelineSection({ phases, project }: { phases: Phase[]; project: ProjectMeta }) {
  return (
    <section id="timeline" className="scroll-mt-24 pt-20">
      <SectionHead
        kicker="03 · Timeline"
        title="Programme at a glance"
        desc="All tasks on one axis with planned windows, live progress and milestones. The red line marks today."
      />
      <Reveal>
        <div className="mt-10">
          <Timeline phases={phases} project={project} />
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------ TEAM ------------------------------------- */

function TeamSection({ departments, team }: { departments: Department[]; team: Member[] }) {
  return (
    <section id="team" className="scroll-mt-24 pt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead
          kicker="04 · Departments & Team"
          title="Who's on site"
          desc="Five departments, six engineers, one project lead — delivering across all three lines."
        />
        <Reveal>
          <Link
            href="/assignments"
            className="inline-flex items-center gap-2 rounded-full border border-black/12 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-brand/40 hover:text-brand"
          >
            See who&apos;s on what
            <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        {/* departments */}
        <Reveal>
          <div className="card h-full p-6">
            <p className="mono-label">Departments</p>
            <ul className="mt-4 divide-y divide-black/8">
              {departments.map((dpt) => (
                <li key={dpt.code} className="flex items-start gap-4 py-3.5">
                  <RoleBadge code={dpt.code} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{dpt.name}</p>
                    <p className="text-xs leading-relaxed text-mute">{dpt.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* team grid */}
        <Reveal delay={90}>
          <div className="card h-full p-6">
            <p className="mono-label">Team</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {team.map((m) => (
                <div
                  key={m.name}
                  className={`relative flex items-center gap-3 rounded-xl border p-3.5 ${
                    m.lead ? "border-brand/40 bg-brand/[0.06]" : "border-black/8 bg-black/[0.02]"
                  }`}
                >
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-lg ${
                      m.lead ? "bg-brand text-white" : "bg-black/10 text-ink"
                    }`}
                  >
                    {m.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                    <p className="truncate text-xs text-mute">
                      {m.title}
                      {m.lead && <span className="text-brand"> · Lead</span>}
                    </p>
                  </div>
                  <span className="ml-auto">
                    <RoleBadge code={m.role} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* CTA */}
      <Reveal>
        <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[var(--radius-card)] border border-black/8 bg-gradient-to-r from-brand/[0.12] to-transparent p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-lg font-semibold text-ink">Need a deeper status read?</p>
            <p className="text-sm text-mute">
              Every task carries its own profile — owner, schedule, dependencies and live progress
              you can update.
            </p>
          </div>
          <Link
            href="/task/8"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-bright"
          >
            View critical-path task
            <span aria-hidden>→</span>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------ ACTIVITY --------------------------------- */

function ActivitySection({ activity }: { activity: ActivityRow[] }) {
  return (
    <section id="activity" className="scroll-mt-24 pt-20">
      <SectionHead
        kicker="05 · Activity"
        title="Recent activity"
        desc="A live trail of what the team has updated, completed and assigned — newest first."
      />
      <Reveal>
        <div className="mt-10">
          <ActivityFeed items={activity} />
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------ shared ----------------------------------- */

function SectionHead({ kicker, title, desc }: { kicker: string; title: string; desc: string }) {
  return (
    <Reveal>
      <div className="max-w-2xl">
        <span className="mono-label text-brand-bright">{kicker}</span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">{desc}</p>
      </div>
    </Reveal>
  );
}
