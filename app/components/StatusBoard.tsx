import Link from "next/link";
import { type Task } from "@/app/lib/types";
import { statusOf, daysBetween, fmtShort } from "@/app/lib/helpers";
import { RoleBadge } from "./RoleBadge";

type Tone = "done" | "doing" | "next";

const HEAD: Record<Tone, { dot: string; label: string; note: string }> = {
  done: { dot: "bg-ink", label: "Done", note: "Delivered & signed off" },
  doing: { dot: "bg-brand", label: "In progress", note: "Being worked on now" },
  next: { dot: "bg-faint", label: "Up next", note: "Planned & scheduled" },
};

export function StatusBoard({ tasks, asOf }: { tasks: Task[]; asOf: string }) {
  const real = tasks.filter((t) => t.type === "T");
  const done = real.filter((t) => t.pct >= 100);
  const next = real.filter((t) => statusOf(t, asOf) === "Upcoming");
  const doing = real.filter((t) => t.pct < 100 && statusOf(t, asOf) !== "Upcoming");

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Column tone="doing" tasks={doing} asOf={asOf} />
      <Column tone="next" tasks={next} asOf={asOf} />
      <Column tone="done" tasks={done} asOf={asOf} />
    </div>
  );
}

function Column({ tone, tasks, asOf }: { tone: Tone; tasks: Task[]; asOf: string }) {
  const h = HEAD[tone];
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-center justify-between border-b border-black/8 pb-3">
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${h.dot}`} />
          <span className="text-sm font-semibold text-ink">{h.label}</span>
        </span>
        <span className="display-num text-2xl text-ink">{tasks.length}</span>
      </div>
      <p className="mono-label mt-2 text-[0.52rem]">{h.note}</p>

      <ul className="mt-3 flex flex-col gap-2">
        {tasks.map((t) => (
          <TaskItem key={t.id} t={t} asOf={asOf} tone={tone} />
        ))}
        {tasks.length === 0 && (
          <li className="rounded-lg border border-dashed border-black/10 px-3 py-5 text-center text-xs text-faint">
            Nothing here.
          </li>
        )}
      </ul>
    </div>
  );
}

function TaskItem({ t, asOf, tone }: { t: Task; asOf: string; tone: Tone }) {
  const d = daysBetween(asOf, t.end);
  const overdue = t.pct < 100 && d < 0;
  const deadline =
    t.pct >= 100 ? "Completed" : overdue ? `Overdue ${-d}d` : d === 0 ? "Due today" : `${d}d left`;

  return (
    <li>
      <Link
        href={`/task/${t.id}`}
        className="group block rounded-lg border border-black/8 bg-black/[0.015] p-3 transition-colors hover:border-brand/40 hover:bg-black/[0.03]"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-sm text-ink/90 group-hover:text-ink">{t.desc}</span>
          <RoleBadge code={t.role} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[0.7rem]">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-mute">{t.owner}</span>
            {t.approval === "APPROVED" && (
              <span className="shrink-0 rounded bg-black/8 px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest text-ink">
                ✓ Signed off
              </span>
            )}
            {t.approval === "CHANGES" && (
              <span className="shrink-0 rounded bg-brand/12 px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest text-brand-bright">
                ⟳ Changes
              </span>
            )}
          </span>
          <span className={`shrink-0 font-mono ${overdue ? "text-brand" : "text-faint"}`}>
            {fmtShort(t.end)} · {deadline}
          </span>
        </div>
        {tone !== "next" && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/8">
            <div
              className="h-full rounded-full"
              style={{
                width: `${t.pct}%`,
                background:
                  t.pct >= 100
                    ? "linear-gradient(90deg,#202024,#3b3b42)"
                    : "linear-gradient(90deg,var(--color-brand-bright),var(--color-brand-deep))",
              }}
            />
          </div>
        )}
      </Link>
    </li>
  );
}
