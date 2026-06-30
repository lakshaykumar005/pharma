import Link from "next/link";
import { type Phase, type Task, type ProjectMeta } from "@/app/lib/types";
import { axisPct, barGeom, monthBands, fmtShort, daysBetween } from "@/app/lib/helpers";
import { RoleBadge } from "./RoleBadge";

/** Faint vertical month gridlines behind every row, so bars read against a grid. */
function GridLines({ bands }: { bands: { label: string; left: number }[] }) {
  return (
    <>
      {bands.map((m, i) =>
        i === 0 ? null : (
          <span key={m.label} className="pointer-events-none absolute top-0 h-full w-px bg-black/[0.05]" style={{ left: `${m.left}%` }} />
        ),
      )}
    </>
  );
}

function Bar({ task, project, asOf }: { task: Task; project: ProjectMeta; asOf: string }) {
  const { left, width } = barGeom(task, project);
  const complete = task.pct >= 100;
  const blocked = !complete && task.state === "BLOCKED";
  const onHold = !complete && task.state === "ON_HOLD";
  const overdue = !complete && daysBetween(asOf, task.end) < 0;
  const notStarted = !complete && !blocked && !onHold && task.pct === 0;

  if (task.type === "M") {
    const l = axisPct(task.start, project);
    return (
      <Link
        href={`/task/${task.id}`}
        className="group absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${l}%` }}
        title={`◆ ${task.desc} · ${fmtShort(task.end)}`}
      >
        <span className="block h-4 w-4 rotate-45 rounded-[3px] bg-brand ring-2 ring-canvas shadow-[0_0_0_4px_rgba(236,28,43,0.18)] transition-transform group-hover:scale-125" />
      </Link>
    );
  }

  const fill = complete
    ? "linear-gradient(90deg,#1b1d22,#3b3b42)"
    : blocked
      ? "repeating-linear-gradient(45deg,var(--color-brand),var(--color-brand) 5px,var(--color-brand-deep) 5px,var(--color-brand-deep) 10px)"
      : onHold
        ? "linear-gradient(90deg,#f59e0b,#b45309)"
        : "linear-gradient(90deg,var(--color-brand-bright),var(--color-brand-deep))";
  const borderColor = complete
    ? "rgba(0,0,0,0.22)"
    : blocked || overdue
      ? "rgba(236,28,43,0.55)"
      : onHold
        ? "rgba(245,158,11,0.6)"
        : notStarted
          ? "rgba(0,0,0,0.18)"
          : "rgba(236,28,43,0.4)";

  return (
    <Link
      href={`/task/${task.id}`}
      className="group absolute top-1/2 z-10 flex h-8 -translate-y-1/2 items-center overflow-hidden rounded-lg border shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all hover:z-30 hover:shadow-[0_6px_18px_-6px_rgba(0,0,0,0.35)] hover:ring-2 hover:ring-brand/40"
      style={{
        left: `${left}%`,
        width: `${width}%`,
        minWidth: 34,
        borderColor,
        borderStyle: notStarted ? "dashed" : "solid",
        background: notStarted ? "rgba(0,0,0,0.025)" : "rgba(0,0,0,0.05)",
      }}
      title={`${task.desc} · ${fmtShort(task.start)}–${fmtShort(task.end)} · ${task.pct}%${
        blocked ? " · BLOCKED" : onHold ? " · ON HOLD" : overdue ? " · OVERDUE" : ""
      }`}
    >
      {/* proportional progress fill */}
      <span className="absolute inset-y-0 left-0 transition-[width] duration-500" style={{ width: `${task.pct}%`, background: fill }} />
      <span className={`relative z-10 flex w-full items-center gap-1 truncate px-2 text-[0.62rem] font-semibold ${complete ? "text-white" : "text-ink"}`}>
        {complete ? (
          <span aria-label="Complete">✓</span>
        ) : (
          <>
            {blocked ? "⚠ " : onHold ? "⏸ " : ""}
            <span className="font-mono">{task.pct}%</span>
          </>
        )}
      </span>
    </Link>
  );
}

export function Timeline({ phases, project }: { phases: Phase[]; project: ProjectMeta }) {
  const todayLeft = axisPct(project.asOf, project);
  const bands = monthBands(project);
  const COLS = "grid grid-cols-[150px_1fr] sm:grid-cols-[240px_1fr]";

  return (
    <div className="card overflow-hidden">
      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-black/8 px-5 py-4">
        <span className="mono-label text-ink/80">Programme timeline</span>
        <LegendSwatch label="Complete" cls="bg-gradient-to-r from-[#1b1d22] to-zinc-700" />
        <LegendSwatch label="In progress" cls="bg-gradient-to-r from-brand-bright to-brand-deep" />
        <LegendSwatch label="Upcoming" cls="border border-dashed border-black/30 bg-black/[0.03]" />
        <span className="flex items-center gap-2 text-xs text-mute">
          <span className="h-2.5 w-4 rounded-sm" style={{ background: "repeating-linear-gradient(45deg,var(--color-brand),var(--color-brand) 3px,var(--color-brand-deep) 3px,var(--color-brand-deep) 6px)" }} />
          Blocked
        </span>
        <LegendSwatch label="On hold" cls="bg-gradient-to-r from-amber-500 to-amber-700" />
        <span className="flex items-center gap-2 text-xs text-mute">
          <span className="h-3 w-3 rotate-45 rounded-[2px] bg-brand" /> Milestone
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* month header */}
          <div className={`${COLS} border-b border-black/8`}>
            <div className="sticky left-0 z-20 bg-canvas-2 px-4 py-2.5">
              <span className="mono-label">Task</span>
            </div>
            <div className="relative h-10">
              {bands.map((m) => (
                <div key={m.label} className="absolute top-0 flex h-full items-center border-l border-black/8 pl-2" style={{ left: `${m.left}%`, width: `${m.width}%` }}>
                  <span className="font-mono text-[0.66rem] uppercase tracking-widest text-faint">{m.label}</span>
                </div>
              ))}
              {/* today marker with label */}
              <div className="absolute top-0 z-30 h-full -translate-x-1/2" style={{ left: `${todayLeft}%` }}>
                <span className="absolute -top-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-2 py-0.5 text-[0.5rem] font-bold uppercase tracking-widest text-white shadow">
                  Today
                </span>
              </div>
            </div>
          </div>

          {/* phases + tasks */}
          {phases.map((phase) => (
            <div key={phase.code}>
              {/* phase header */}
              <div className={`${COLS} border-b border-black/8 bg-black/[0.025]`}>
                <div className="sticky left-0 z-20 bg-canvas-2 px-4 py-2.5">
                  <span className="block font-mono text-[0.6rem] tracking-widest text-brand-bright">{phase.code}</span>
                  <span className="block truncate text-sm font-semibold text-ink">{phase.name}</span>
                </div>
                <div className="relative h-12">
                  <GridLines bands={bands} />
                  {/* phase band with proportional fill */}
                  <span
                    className="absolute top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-black/[0.07]"
                    style={{ left: `${axisPct(phase.start, project)}%`, width: `${axisPct(phase.end, project) - axisPct(phase.start, project)}%` }}
                  >
                    <span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand to-brand-deep" style={{ width: `${phase.pct}%` }} />
                  </span>
                  <span className="absolute top-1/2 -translate-y-1/2 font-mono text-[0.6rem] font-semibold text-mute" style={{ left: `calc(${axisPct(phase.end, project)}% + 8px)` }}>
                    {phase.pct}%
                  </span>
                  <span className="absolute top-0 z-20 h-full w-px bg-brand-bright/60" style={{ left: `${todayLeft}%` }} />
                </div>
              </div>

              {/* task rows */}
              {phase.tasks.map((task, i) => (
                <div key={task.id} className={`${COLS} border-b border-black/[0.05] last:border-0 ${i % 2 ? "bg-black/[0.008]" : ""} hover:bg-brand/[0.03]`}>
                  <div className="sticky left-0 z-20 flex items-center gap-2 bg-canvas-2 px-4 py-2.5">
                    <RoleBadge code={task.role} />
                    <span className="truncate text-[0.8rem] text-mute" title={task.desc}>
                      {task.type === "M" ? task.desc.replace(/^Milestone-\d+ · /, "◆ ") : task.desc}
                    </span>
                  </div>
                  <div className="relative h-12">
                    <GridLines bands={bands} />
                    <span className="absolute top-0 z-0 h-full w-px bg-brand-bright/30" style={{ left: `${todayLeft}%` }} />
                    <Bar task={task} project={project} asOf={project.asOf} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LegendSwatch({ label, cls }: { label: string; cls: string }) {
  return (
    <span className="flex items-center gap-2 text-xs text-mute">
      <span className={`h-2.5 w-4 rounded-sm ${cls}`} /> {label}
    </span>
  );
}
