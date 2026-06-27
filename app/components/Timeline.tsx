import Link from "next/link";
import { type Phase, type Task, type ProjectMeta } from "@/app/lib/types";
import { axisPct, barGeom, monthBands, fmtShort } from "@/app/lib/helpers";
import { RoleBadge } from "./RoleBadge";

function Bar({ task, project }: { task: Task; project: ProjectMeta }) {
  const { left, width } = barGeom(task, project);
  const complete = task.pct >= 100;
  const started = task.pct > 0;

  if (task.type === "M") {
    const l = axisPct(task.start, project);
    return (
      <Link
        href={`/task/${task.id}`}
        className="group absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${l}%` }}
        title={task.desc}
      >
        <span className="block h-3.5 w-3.5 rotate-45 rounded-[3px] bg-brand ring-2 ring-canvas shadow-[0_0_0_4px_rgba(236,28,43,0.18)] transition-transform group-hover:scale-125" />
      </Link>
    );
  }

  return (
    <Link
      href={`/task/${task.id}`}
      className="group absolute top-1/2 z-10 flex h-7 -translate-y-1/2 items-center overflow-hidden rounded-md border transition-all hover:brightness-110 hover:ring-2 hover:ring-brand/40"
      style={{
        left: `${left}%`,
        width: `${width}%`,
        minWidth: 22,
        borderColor: complete
          ? "rgba(0,0,0,0.22)"
          : started
            ? "rgba(236,28,43,0.55)"
            : "rgba(0,0,0,0.14)",
        background: complete ? "rgba(0,0,0,0.10)" : "rgba(0,0,0,0.03)",
      }}
      title={`${task.desc} · ${fmtShort(task.start)}–${fmtShort(task.end)} · ${task.pct}%`}
    >
      <span
        className="absolute inset-y-0 left-0"
        style={{
          width: `${task.pct}%`,
          background: complete
            ? "linear-gradient(90deg,#202024,#3b3b42)"
            : "linear-gradient(90deg,var(--color-brand-bright),var(--color-brand-deep))",
        }}
      />
      <span
        className={`relative z-10 truncate px-2 font-mono text-[0.62rem] ${complete ? "text-paper-ink" : "text-ink"}`}
      >
        {task.pct}%
      </span>
    </Link>
  );
}

export function Timeline({ phases, project }: { phases: Phase[]; project: ProjectMeta }) {
  const todayLeft = axisPct(project.asOf, project);
  const bands = monthBands(project);

  return (
    <div className="card overflow-hidden">
      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-black/8 px-5 py-4">
        <span className="mono-label text-ink/80">Programme timeline</span>
        <span className="flex items-center gap-2 text-xs text-mute">
          <span className="h-2.5 w-4 rounded-sm bg-gradient-to-r from-[#1b1d22] to-zinc-700" /> Complete
        </span>
        <span className="flex items-center gap-2 text-xs text-mute">
          <span className="h-2.5 w-4 rounded-sm bg-gradient-to-r from-brand-bright to-brand-deep" /> In
          progress
        </span>
        <span className="flex items-center gap-2 text-xs text-mute">
          <span className="h-2.5 w-4 rounded-sm border border-black/20 bg-black/5" /> Upcoming
        </span>
        <span className="flex items-center gap-2 text-xs text-mute">
          <span className="h-3 w-3 rotate-45 rounded-[2px] bg-brand" /> Milestone
        </span>
        <span className="ml-auto flex items-center gap-2 text-xs text-brand-bright">
          <span className="h-3 w-0.5 bg-brand-bright" /> Today · {fmtShort(project.asOf)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* month header */}
          <div className="grid grid-cols-[150px_1fr] border-b border-black/8 sm:grid-cols-[220px_1fr]">
            <div className="sticky left-0 z-20 bg-canvas-2 px-4 py-2">
              <span className="mono-label">Task</span>
            </div>
            <div className="relative h-9">
              {bands.map((m) => (
                <div
                  key={m.label}
                  className="absolute top-0 flex h-full items-center border-l border-black/8 pl-2"
                  style={{ left: `${m.left}%`, width: `${m.width}%` }}
                >
                  <span className="font-mono text-[0.66rem] uppercase tracking-widest text-faint">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* phases + tasks */}
          {phases.map((phase) => (
            <div key={phase.code}>
              {/* phase header */}
              <div className="grid grid-cols-[150px_1fr] border-b border-black/8 bg-black/[0.02] sm:grid-cols-[220px_1fr]">
                <div className="sticky left-0 z-20 bg-canvas-2 px-4 py-2.5">
                  <span className="block font-mono text-[0.6rem] tracking-widest text-brand-bright">
                    {phase.code}
                  </span>
                  <span className="block truncate text-sm font-semibold text-ink">{phase.name}</span>
                </div>
                <div className="relative h-12">
                  <span
                    className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand/30 to-brand/5"
                    style={{
                      left: `${axisPct(phase.start, project)}%`,
                      width: `${axisPct(phase.end, project) - axisPct(phase.start, project)}%`,
                    }}
                  />
                  <span
                    className="absolute top-0 h-full w-px bg-brand-bright/70"
                    style={{ left: `${todayLeft}%` }}
                  />
                </div>
              </div>

              {/* task rows */}
              {phase.tasks.map((task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-[150px_1fr] border-b border-black/[0.05] last:border-0 hover:bg-black/[0.015] sm:grid-cols-[220px_1fr]"
                >
                  <div className="sticky left-0 z-20 flex items-center gap-2 bg-canvas-2 px-4 py-2.5">
                    <RoleBadge code={task.role} />
                    <span className="truncate text-[0.8rem] text-mute" title={task.desc}>
                      {task.type === "M" ? task.desc.replace(/^Milestone-\d+ · /, "◆ ") : task.desc}
                    </span>
                  </div>
                  <div className="relative h-11">
                    <span
                      className="absolute top-0 z-0 h-full w-px bg-brand-bright/40"
                      style={{ left: `${todayLeft}%` }}
                    />
                    <Bar task={task} project={project} />
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
