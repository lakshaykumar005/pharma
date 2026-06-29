import Link from "next/link";
import { requireUser, roleLabel } from "@/app/lib/auth";
import { getProject, getAllTasks } from "@/app/lib/queries";
import { computeAlerts, computeSignoffs, daysBetween, fmtShort } from "@/app/lib/helpers";
import { type Task } from "@/app/lib/types";
import { RoleBadge } from "@/app/components/RoleBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Alerts — Command Center" };

export default async function AlertsPage() {
  const user = await requireUser("/alerts");
  const [project, all] = await Promise.all([getProject(), getAllTasks()]);

  /* ----- client (VIEWER): a review hub built around their sign-off ----- */
  if (user.role === "VIEWER") {
    const { awaiting, changes, approved } = computeSignoffs(all.filter((t) => t.type === "T" || t.type === "M"));
    const pending = awaiting.length;
    return (
      <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <header>
          <span className="mono-label text-brand-bright">Client · your reviews</span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Your sign-off</h1>
          <p className="mt-2 text-sm text-mute">
            {pending === 0
              ? "You're all caught up — nothing is waiting on your review."
              : `${pending} delivered item${pending === 1 ? "" : "s"} waiting for your sign-off.`}
          </p>
        </header>
        <div className="mt-8 space-y-6">
          <SignoffGroup title="Awaiting your sign-off" tone="await" tasks={awaiting} empty="Nothing waiting on you." />
          <SignoffGroup title="Changes you requested" tone="changes" tasks={changes} empty="No open change requests." />
          <SignoffGroup title="Approved by you" tone="approved" tasks={approved} empty="No sign-offs yet." />
        </div>
      </div>
    );
  }

  /* ----- manager / engineer: delivery alerts + what the client flagged ----- */
  const scope = user.role === "EDITOR" ? all.filter((t) => t.owner === user.name || (!!user.department && t.role === user.department)) : all;
  const { overdue, dueSoon, blocked } = computeAlerts(scope, project.asOf);
  const clientChanges = scope.filter((t) => t.approval === "CHANGES");
  const total = overdue.length + dueSoon.length + blocked.length + clientChanges.length;

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <header>
        <span className="mono-label text-brand-bright">{roleLabel(user.role)} · alerts</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Needs attention</h1>
        <p className="mt-2 text-sm text-mute">
          {total === 0
            ? "All clear — nothing overdue, blocked, flagged, or due in the next 7 days."
            : `${total} item${total === 1 ? "" : "s"} need attention${user.role === "EDITOR" ? " on your work" : " across the programme"}.`}
        </p>
      </header>

      <div className="mt-8 space-y-6">
        <SignoffGroup title="Changes requested by client" tone="changes" tasks={clientChanges} empty="No client change requests." />
        <Group title="Overdue" tone="overdue" tasks={overdue} asOf={project.asOf} empty="Nothing overdue." />
        <Group title="Blocked" tone="blocked" tasks={blocked} asOf={project.asOf} empty="Nothing blocked." />
        <Group title="Due within 7 days" tone="soon" tasks={dueSoon} asOf={project.asOf} empty="Nothing due soon." />
      </div>
    </div>
  );
}

function Group({
  title,
  tone,
  tasks,
  asOf,
  empty,
}: {
  title: string;
  tone: "overdue" | "blocked" | "soon";
  tasks: Task[];
  asOf: string;
  empty: string;
}) {
  const dot = tone === "soon" ? "bg-amber-500" : "bg-brand";
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between border-b border-black/8 pb-3">
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <span className="text-sm font-semibold text-ink">{title}</span>
        </span>
        <span className="display-num text-2xl text-ink">{tasks.length}</span>
      </div>
      {tasks.length === 0 ? (
        <p className="mt-3 text-sm text-faint">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tasks.map((t) => {
            const dd = daysBetween(asOf, t.end);
            const meta = tone === "overdue" ? `Overdue ${-dd}d` : tone === "soon" ? `${dd}d left` : "Blocked";
            return (
              <li key={t.id}>
                <Link
                  href={`/task/${t.id}`}
                  className="group flex items-center gap-3 rounded-lg border border-black/8 bg-black/[0.015] px-3 py-2.5 transition-colors hover:border-brand/40 hover:bg-black/[0.03]"
                >
                  <RoleBadge code={t.role} />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink/90 group-hover:text-ink">{t.desc}</span>
                  <span className="shrink-0 text-xs text-mute">{t.owner}</span>
                  <span className={`shrink-0 font-mono text-[0.7rem] ${tone === "soon" ? "text-amber-600" : "text-brand"}`}>
                    {fmtShort(t.end)} · {meta}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function SignoffGroup({
  title,
  tone,
  tasks,
  empty,
}: {
  title: string;
  tone: "await" | "changes" | "approved";
  tasks: Task[];
  empty: string;
}) {
  const dot = tone === "approved" ? "bg-ink" : tone === "changes" ? "bg-brand" : "bg-amber-500";
  const meta = tone === "approved" ? "Approved" : tone === "changes" ? "Changes requested" : "Awaiting review";
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between border-b border-black/8 pb-3">
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <span className="text-sm font-semibold text-ink">{title}</span>
        </span>
        <span className="display-num text-2xl text-ink">{tasks.length}</span>
      </div>
      {tasks.length === 0 ? (
        <p className="mt-3 text-sm text-faint">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tasks.map((t) => (
            <li key={t.id}>
              <Link
                href={`/task/${t.id}`}
                className="group flex items-center gap-3 rounded-lg border border-black/8 bg-black/[0.015] px-3 py-2.5 transition-colors hover:border-brand/40 hover:bg-black/[0.03]"
              >
                <RoleBadge code={t.role} />
                <span className="min-w-0 flex-1 truncate text-sm text-ink/90 group-hover:text-ink">{t.desc}</span>
                <span className="shrink-0 text-xs text-mute">{t.owner}</span>
                <span className={`shrink-0 font-mono text-[0.7rem] ${tone === "approved" ? "text-faint" : tone === "changes" ? "text-brand" : "text-amber-600"}`}>
                  {meta}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
