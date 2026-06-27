import Link from "next/link";
import { type Phase } from "@/app/lib/types";
import { fmtShort, statusOf } from "@/app/lib/helpers";
import { ProgressRing } from "./ProgressRing";
import { RoleBadge } from "./RoleBadge";
import { StatusBadge } from "./StatusBadge";

export function WorkstreamCard({
  phase,
  index,
  asOf,
}: {
  phase: Phase;
  index: number;
  asOf: string;
}) {
  const tasks = phase.tasks.filter((t) => t.type === "T");
  const done = tasks.filter((t) => t.pct >= 100).length;

  return (
    <article className="card flex h-full flex-col p-6 transition-colors duration-300 hover:border-brand/40">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[0.66rem] tracking-[0.2em] text-brand-bright">
            {phase.code}
          </span>
          <h3 className="mt-1 text-xl font-semibold leading-tight tracking-tight text-ink">
            {phase.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-mute">
            <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-brand" />
            {phase.subtitle}
          </p>
        </div>
        <ProgressRing value={phase.pct} size={74} stroke={7} />
      </div>

      {/* meta */}
      <div className="mt-5 grid grid-cols-3 gap-2 border-y border-white/8 py-3 text-center">
        <Meta label="Window" value={`${fmtShort(phase.start)}–${fmtShort(phase.end)}`} />
        <Meta label="Tasks" value={`${done}/${tasks.length} done`} />
        <Meta label="Target" value={fmtShort(phase.end)} />
      </div>

      {/* task list */}
      <ul className="mt-2 flex flex-col">
        {tasks.map((t) => (
          <li key={t.id}>
            <Link
              href={`/task/${t.id}`}
              className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.04]"
            >
              <RoleBadge code={t.role} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="block truncate text-sm text-ink/90 group-hover:text-ink">
                    {t.desc}
                  </span>
                  {t.subtasks.length > 0 && (
                    <span className="shrink-0 font-mono text-[0.58rem] text-faint">
                      ☑ {t.subtasks.filter((s) => s.done).length}/{t.subtasks.length}
                    </span>
                  )}
                </span>
                <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-white/8">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${t.pct}%`,
                      background:
                        t.pct >= 100
                          ? "linear-gradient(90deg,#fff,#cfcfcf)"
                          : "linear-gradient(90deg,var(--color-brand-bright),var(--color-brand-deep))",
                    }}
                  />
                </span>
              </span>
              <span className="shrink-0">
                <StatusBadge status={statusOf(t, asOf)} />
              </span>
              <svg
                className="h-4 w-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-bright"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={`/task/${tasks[0].id}`}
        className="mono-label mt-4 inline-flex items-center gap-2 text-brand-bright transition-colors hover:text-white"
      >
        Open workstream detail
        <span aria-hidden>→</span>
      </Link>

      <span className="pointer-events-none mt-4 select-none text-right font-display text-5xl leading-none text-white/[0.04]">
        0{index + 1}
      </span>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mono-label text-[0.55rem]">{label}</p>
      <p className="mt-1 text-xs font-medium text-ink">{value}</p>
    </div>
  );
}
