"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type Task, type RoleCode } from "@/app/lib/types";
import { statusOf, fmtShort, daysBetween, type Status } from "@/app/lib/helpers";
import { RoleBadge } from "./RoleBadge";
import { StatusBadge } from "./StatusBadge";

type Quick = "all" | "mine" | "signoff" | "overdue" | "blocked" | "in-progress" | "upcoming" | "done";

export function TasksExplorer({
  tasks,
  phases,
  departments,
  owners,
  asOf,
  role,
  name,
  department,
}: {
  tasks: Task[];
  phases: { code: string; name: string }[];
  departments: { code: RoleCode; name: string }[];
  owners: string[];
  asOf: string;
  role: string;
  name: string;
  department: RoleCode | null;
}) {
  const canEdit = role === "ADMIN" || role === "EDITOR";
  const isClient = role === "VIEWER";

  const [quick, setQuick] = useState<Quick>("all");
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState("");
  const [dept, setDept] = useState("");
  const [owner, setOwner] = useState("");
  const [sort, setSort] = useState<"deadline" | "pct" | "phase" | "az">("deadline");

  const mineOf = (t: Task) => t.owner === name || (!!department && t.role === department);
  const isInProgress = (s: Status) => s === "In progress" || s === "Active";

  const stats = useMemo(() => {
    const s = (st: Status) => tasks.filter((t) => statusOf(t, asOf) === st).length;
    return {
      total: tasks.length,
      done: tasks.filter((t) => t.pct >= 100).length,
      inProgress: tasks.filter((t) => isInProgress(statusOf(t, asOf))).length,
      overdue: s("Overdue"),
      blocked: s("Blocked"),
      signoff: tasks.filter((t) => t.pct >= 100 && !t.approval).length,
      mine: tasks.filter(mineOf).length,
    };
  }, [tasks, asOf]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = tasks.slice();
    // quick chip
    list = list.filter((t) => {
      const s = statusOf(t, asOf);
      switch (quick) {
        case "mine": return mineOf(t);
        case "signoff": return t.pct >= 100 && !t.approval;
        case "overdue": return s === "Overdue";
        case "blocked": return s === "Blocked";
        case "in-progress": return isInProgress(s);
        case "upcoming": return s === "Upcoming";
        case "done": return t.pct >= 100;
        default: return true;
      }
    });
    if (phase) list = list.filter((t) => t.phaseCode === phase);
    if (dept) list = list.filter((t) => t.role === dept);
    if (owner) list = list.filter((t) => t.owner === owner);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((t) => t.desc.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q));
    list.sort((a, b) => {
      if (sort === "pct") return b.pct - a.pct;
      if (sort === "az") return a.desc.localeCompare(b.desc);
      if (sort === "phase") return a.phaseCode.localeCompare(b.phaseCode) || daysBetween(asOf, a.end) - daysBetween(asOf, b.end);
      return daysBetween(asOf, a.end) - daysBetween(asOf, b.end); // deadline
    });
    return list;
  }, [tasks, asOf, quick, phase, dept, owner, query, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const chips: { key: Quick; label: string; n: number; show: boolean }[] = [
    { key: "all", label: "All", n: stats.total, show: true },
    { key: "mine", label: "My tasks", n: stats.mine, show: canEdit },
    { key: "signoff", label: "Awaiting my sign-off", n: stats.signoff, show: isClient },
    { key: "in-progress", label: "In progress", n: stats.inProgress, show: true },
    { key: "overdue", label: "Overdue", n: stats.overdue, show: true },
    { key: "blocked", label: "Blocked", n: stats.blocked, show: true },
    { key: "done", label: "Done", n: stats.done, show: true },
  ];

  const selectCls = "rounded-lg border border-black/12 bg-black/[0.03] px-3 py-2 text-sm text-ink outline-none focus:border-brand/60";
  const reset = !!(quick !== "all" || query || phase || dept || owner);

  return (
    <div>
      {/* quick chips */}
      <div className="flex flex-wrap gap-2">
        {chips.filter((c) => c.show).map((c) => (
          <button
            key={c.key}
            onClick={() => setQuick(c.key)}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              quick === c.key ? "bg-paper text-paper-ink" : "border border-black/12 text-mute hover:border-brand/40 hover:text-ink"
            }`}
          >
            {c.label}
            <span className={`font-mono text-[0.7rem] ${quick === c.key ? "text-zinc-400" : "text-faint"}`}>{c.n}</span>
          </button>
        ))}
      </div>

      {/* controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search task or owner…"
          className={`${selectCls} min-w-[200px] flex-1 placeholder:text-faint`}
        />
        <select value={phase} onChange={(e) => setPhase(e.target.value)} className={selectCls} aria-label="Filter by phase">
          <option value="">All phases</option>
          {phases.map((p) => <option key={p.code} value={p.code}>{p.code} · {p.name}</option>)}
        </select>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className={selectCls} aria-label="Filter by department">
          <option value="">All departments</option>
          {departments.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
        </select>
        <select value={owner} onChange={(e) => setOwner(e.target.value)} className={selectCls} aria-label="Filter by owner">
          <option value="">All owners</option>
          {owners.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={selectCls} aria-label="Sort">
          <option value="deadline">Sort: deadline</option>
          <option value="pct">Sort: % complete</option>
          <option value="phase">Sort: phase</option>
          <option value="az">Sort: A–Z</option>
        </select>
        {reset && (
          <button onClick={() => { setQuick("all"); setQuery(""); setPhase(""); setDept(""); setOwner(""); }} className="text-xs text-faint hover:text-brand">
            Clear
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-mute">
        Showing <span className="font-semibold text-ink">{filtered.length}</span> of {tasks.length} tasks
      </p>

      {/* table */}
      <div className="card mt-3 overflow-x-auto p-0">
        <div className="min-w-[820px] divide-y divide-black/8">
          <div className="grid grid-cols-[1.8fr_0.6fr_0.6fr_1fr_1.1fr_0.7fr_auto] gap-3 px-4 py-2.5">
            {["Task", "Phase", "Dept", "Owner", "Window", "Progress", "Status"].map((h) => (
              <span key={h} className="mono-label text-[0.52rem]">{h}</span>
            ))}
          </div>
          {filtered.map((t) => {
            const s = statusOf(t, asOf);
            const dd = daysBetween(asOf, t.end);
            const subs = t.subtasks.length;
            const subsDone = t.subtasks.filter((x) => x.done).length;
            return (
              <Link
                key={t.id}
                href={`/task/${t.id}`}
                className="grid grid-cols-[1.8fr_0.6fr_0.6fr_1fr_1.1fr_0.7fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-brand/[0.03]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink" title={t.desc}>{t.desc}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-[0.68rem] text-faint">
                    {subs > 0 && <span className="font-mono">☑ {subsDone}/{subs}</span>}
                    {t.approval === "APPROVED" && <span className="text-mute">· ✓ signed off</span>}
                    {t.approval === "CHANGES" && <span className="text-brand-bright">· ⟳ changes requested</span>}
                  </span>
                </span>
                <span className="font-mono text-[0.62rem] text-mute">{t.phaseCode}</span>
                <RoleBadge code={t.role} />
                <span className="truncate text-xs text-mute" title={t.owner}>{t.owner}</span>
                <span className="text-[0.7rem] text-mute">
                  <span className="font-mono">{fmtShort(t.start)}–{fmtShort(t.end)}</span>
                  <span className={`ml-1 ${t.pct < 100 && dd < 0 ? "text-brand" : "text-faint"}`}>
                    {t.pct >= 100 ? "" : dd < 0 ? `· ${-dd}d over` : dd === 0 ? "· today" : `· ${dd}d`}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-12 overflow-hidden rounded-full bg-black/8">
                    <span className="block h-full rounded-full" style={{ width: `${t.pct}%`, background: t.pct >= 100 ? "linear-gradient(90deg,#202024,#3b3b42)" : "linear-gradient(90deg,var(--color-brand-bright),var(--color-brand-deep))" }} />
                  </span>
                  <span className="w-7 text-right font-mono text-[0.62rem] text-ink">{t.pct}%</span>
                </span>
                <StatusBadge status={s} />
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-faint">No tasks match these filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
