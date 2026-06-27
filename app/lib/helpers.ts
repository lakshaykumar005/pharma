/* ============================================================================
   Pure helpers — date math, progress, status. No data imports; everything is
   passed in, so these run on server or client.
   ============================================================================ */

import type { ProjectMeta, Task } from "./types";

const MS_DAY = 86_400_000;

export function d(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

export function daysBetween(a: string, b: string): number {
  return Math.round((d(b).getTime() - d(a).getTime()) / MS_DAY);
}

/** "17 Jun" */
export function fmtShort(iso: string): string {
  return d(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/** "17 Jun 2026" */
export function fmtLong(iso: string): string {
  return d(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** "Wed" */
export function fmtWeekday(iso: string): string {
  return d(iso).toLocaleDateString("en-GB", { weekday: "short" });
}

export function daysToGo(p: ProjectMeta): number {
  return Math.max(0, daysBetween(p.asOf, p.end));
}

export function totalDays(p: ProjectMeta): number {
  return daysBetween(p.start, p.end) + 1;
}

export function programmeDay(p: ProjectMeta): number {
  return Math.min(totalDays(p), Math.max(0, daysBetween(p.start, p.asOf) + 1));
}

/** Work-day-weighted overall progress across every task. */
export function overallProgress(tasks: Task[]): number {
  const real = tasks.filter((t) => t.type === "T");
  const totalWork = real.reduce((s, t) => s + t.workDays, 0);
  if (!totalWork) return 0;
  const done = real.reduce((s, t) => s + t.workDays * (t.pct / 100), 0);
  return Math.round((done / totalWork) * 100);
}

export type Status = "Complete" | "In progress" | "Active" | "Upcoming" | "Overdue";

export function statusOf(t: Task, asOf: string): Status {
  if (t.pct >= 100) return "Complete";
  const now = d(asOf).getTime();
  const start = d(t.start).getTime();
  const end = d(t.end).getTime();
  if (t.pct > 0) return "In progress";
  if (now > end) return "Overdue";
  if (now >= start && now <= end) return "Active";
  return "Upcoming";
}

/** Position (0–100) of a date along the Gantt axis. */
export function axisPct(iso: string, p: ProjectMeta): number {
  const span = daysBetween(p.axisStart, p.axisEnd);
  return (daysBetween(p.axisStart, iso) / span) * 100;
}

/** {left, width} as % for a task bar on the axis. */
export function barGeom(t: Task, p: ProjectMeta): { left: number; width: number } {
  const left = axisPct(t.start, p);
  const right = axisPct(t.end, p);
  return { left, width: Math.max(right - left, 0.8) };
}

export function tasksDone(tasks: Task[]): number {
  return tasks.filter((t) => t.type === "T" && t.pct >= 100).length;
}
export function tasksActive(tasks: Task[]): number {
  return tasks.filter((t) => t.type === "T" && t.pct > 0 && t.pct < 100).length;
}
export function tasksTotal(tasks: Task[]): number {
  return tasks.filter((t) => t.type === "T").length;
}

/** YYYY-MM-DD from a Date's LOCAL components (avoids UTC shift). */
function isoLocal(x: Date): string {
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${m}-${day}`;
}

/** Month bands for the timeline header. */
export function monthBands(p: ProjectMeta): { label: string; left: number; width: number }[] {
  const out: { label: string; left: number; width: number }[] = [];
  const start = d(p.axisStart);
  const end = d(p.axisEnd);
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= end) {
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    const from = cur < start ? start : cur;
    const to = next > end ? end : next;
    out.push({
      label: cur.toLocaleDateString("en-GB", { month: "long" }),
      left: axisPct(isoLocal(from), p),
      width: axisPct(isoLocal(to), p) - axisPct(isoLocal(from), p),
    });
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}
