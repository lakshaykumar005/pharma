import { requireUser } from "@/app/lib/auth";
import { getSnapshot, getAllTasks } from "@/app/lib/queries";
import { overallProgress, statusOf, daysToGo, fmtLong, fmtShort, computeAlerts } from "@/app/lib/helpers";
import { PrintButton } from "@/app/components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Programme report — Command Center" };

export default async function ReportPage() {
  await requireUser("/report");
  const [{ project, phases }, tasks] = await Promise.all([getSnapshot(), getAllTasks()]);
  const real = tasks.filter((t) => t.type === "T");
  const overall = overallProgress(tasks);
  const { overdue, blocked } = computeAlerts(tasks, project.asOf);

  return (
    <div className="mx-auto max-w-[900px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      {/* actions (hidden in print) */}
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="mono-label text-brand-bright">Client report</span>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Programme status report</h1>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export/tasks"
            className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2.5 text-sm font-medium text-ink hover:border-brand/40"
          >
            Download CSV
          </a>
          <PrintButton />
        </div>
      </div>

      {/* printable sheet */}
      <article className="rounded-[var(--radius-card)] border border-black/10 p-8 print:border-0 print:p-0" style={{ background: "var(--color-panel)" }}>
        <header className="flex items-start justify-between border-b border-black/10 pb-5">
          <div>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-faint">{project.builder}</p>
            <h2 className="mt-1 font-display text-3xl uppercase tracking-tight text-ink">{project.client}</h2>
            <p className="mt-1 text-sm text-mute">{project.programme} · {project.blurb}</p>
          </div>
          <div className="text-right">
            <p className="display-num text-4xl text-ink">{overall}%</p>
            <p className="mono-label text-[0.55rem]">overall</p>
          </div>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Fact k="As of" v={fmtLong(project.asOf)} />
          <Fact k="Target close" v={fmtShort(project.end)} />
          <Fact k="Days to go" v={String(daysToGo(project))} />
          <Fact k="Priority" v={project.priority} />
        </div>

        {(overdue.length > 0 || blocked.length > 0) && (
          <p className="mt-5 rounded-lg border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm text-ink">
            <strong>Attention:</strong> {overdue.length} overdue · {blocked.length} blocked.
          </p>
        )}

        {/* per workstream */}
        <h3 className="mt-7 text-sm font-semibold uppercase tracking-wide text-ink">Workstreams</h3>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {phases.map((p) => (
              <tr key={p.code} className="border-b border-black/8">
                <td className="py-2 font-mono text-xs text-faint">{p.code}</td>
                <td className="py-2 font-medium text-ink">{p.name}</td>
                <td className="py-2 text-right text-mute">{fmtShort(p.end)}</td>
                <td className="w-24 py-2 text-right font-semibold text-ink">{p.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* task table */}
        <h3 className="mt-7 text-sm font-semibold uppercase tracking-wide text-ink">All tasks ({real.length})</h3>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="border-b border-black/15 text-left text-faint">
              <th className="py-1.5 font-mono font-normal uppercase tracking-widest">Task</th>
              <th className="py-1.5 font-mono font-normal uppercase tracking-widest">Owner</th>
              <th className="py-1.5 font-mono font-normal uppercase tracking-widest">Window</th>
              <th className="py-1.5 text-right font-mono font-normal uppercase tracking-widest">%</th>
              <th className="py-1.5 text-right font-mono font-normal uppercase tracking-widest">Status</th>
              <th className="py-1.5 text-right font-mono font-normal uppercase tracking-widest">Sign-off</th>
            </tr>
          </thead>
          <tbody>
            {real.map((t) => (
              <tr key={t.id} className="border-b border-black/5">
                <td className="py-1.5 pr-2 text-ink">{t.desc}</td>
                <td className="py-1.5 pr-2 text-mute">{t.owner}</td>
                <td className="py-1.5 pr-2 font-mono text-faint">{fmtShort(t.start)}–{fmtShort(t.end)}</td>
                <td className="py-1.5 text-right text-ink">{t.pct}%</td>
                <td className="py-1.5 text-right text-mute">{statusOf(t, project.asOf)}</td>
                <td className="py-1.5 text-right text-mute">
                  {t.approval === "APPROVED"
                    ? "✓ Approved"
                    : t.approval === "CHANGES"
                      ? "Changes"
                      : t.pct >= 100
                        ? "Awaiting"
                        : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="mt-8 border-t border-black/10 pt-4 text-[0.65rem] text-faint">
          Generated {fmtLong(project.asOf)} · {project.builder} · Confidential — for {project.client}.
        </footer>
      </article>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="mono-label text-[0.5rem]">{k}</p>
      <p className="mt-1 font-medium text-ink">{v}</p>
    </div>
  );
}
