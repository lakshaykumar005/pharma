"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Subtask } from "@/app/lib/types";

const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export function Subtasks({
  taskId,
  initial,
  canEdit,
  team = [],
}: {
  taskId: number;
  initial: Subtask[];
  canEdit: boolean;
  team?: string[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Subtask[]>(initial);
  const [title, setTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.length;
  const done = items.filter((s) => s.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  async function toggle(s: Subtask) {
    if (!canEdit || busy) return;
    const next = !s.done;
    setItems((prev) => prev.map((x) => (x.id === s.id ? { ...x, done: next } : x)));
    setError(null);
    try {
      const res = await fetch(`/api/subtasks/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setItems((prev) => prev.map((x) => (x.id === s.id ? { ...x, done: !next } : x)));
      setError("Couldn't save — try again.");
    }
  }

  async function assign(s: Subtask, value: string) {
    const who = value || null;
    const prev = items;
    setItems((p) => p.map((x) => (x.id === s.id ? { ...x, assignee: who } : x)));
    setError(null);
    try {
      const res = await fetch(`/api/subtasks/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee: who }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setItems(prev);
      setError("Couldn't reassign — try again.");
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const clean = title.trim();
    if (!clean || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: clean, assignee: newAssignee || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((prev) => [...prev, { id: data.subtask.id, title: clean, done: false, order: prev.length, assignee: newAssignee || null }]);
      setTitle("");
      setNewAssignee("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add subtask.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: Subtask) {
    if (!canEdit || busy) return;
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== s.id));
    setError(null);
    try {
      const res = await fetch(`/api/subtasks/${s.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setItems(prev);
      setError("Couldn't remove — try again.");
    }
  }

  const selectCls =
    "shrink-0 rounded-md border border-black/12 bg-black/[0.03] px-2 py-1 text-[0.7rem] text-ink outline-none focus:border-brand/60";

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <p className="mono-label">Subtasks</p>
        {total > 0 && (
          <span className="font-mono text-[0.66rem] text-mute">
            {done}/{total} · {pct}%
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/8">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${pct}%`,
              background:
                pct >= 100
                  ? "linear-gradient(90deg,#202024,#3b3b42)"
                  : "linear-gradient(90deg,var(--color-brand-bright),var(--color-brand-deep))",
            }}
          />
        </div>
      )}

      <ul className="mt-4 space-y-1.5">
        {items.map((s) => (
          <li
            key={s.id}
            className="group flex items-center gap-3 rounded-lg border border-black/8 bg-black/[0.02] px-3 py-2.5"
          >
            <button
              type="button"
              onClick={() => toggle(s)}
              disabled={!canEdit}
              aria-pressed={s.done}
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                s.done ? "border-brand bg-brand text-white" : "border-black/25 text-transparent hover:border-brand/60"
              } ${canEdit ? "cursor-pointer" : "cursor-default"}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </button>
            <span className={`min-w-0 flex-1 text-sm ${s.done ? "text-faint line-through" : "text-ink/90"}`}>
              {s.title}
            </span>

            {/* assignee — who's working on this subtask */}
            {canEdit ? (
              <select
                value={s.assignee ?? ""}
                onChange={(e) => assign(s, e.target.value)}
                className={selectCls}
                aria-label="Assign subtask"
              >
                <option value="">Unassigned</option>
                {team.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : s.assignee ? (
              <span className="flex shrink-0 items-center gap-1.5 text-[0.7rem] text-mute">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-black/8 font-mono text-[0.5rem] text-ink">
                  {initials(s.assignee)}
                </span>
                {s.assignee}
              </span>
            ) : (
              <span className="shrink-0 text-[0.7rem] text-faint">Unassigned</span>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={() => remove(s)}
                aria-label="Delete subtask"
                className="shrink-0 text-faint opacity-0 transition-opacity hover:text-brand-bright group-hover:opacity-100"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </li>
        ))}
        {total === 0 && (
          <li className="rounded-lg border border-dashed border-black/10 px-3 py-4 text-center text-sm text-faint">
            {canEdit ? "No subtasks yet — add the first one below." : "No subtasks for this task."}
          </li>
        )}
      </ul>

      {canEdit && (
        <form onSubmit={add} className="mt-3 flex flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a subtask…"
            maxLength={160}
            className="min-w-0 flex-1 rounded-lg border border-black/12 bg-black/[0.03] px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/60"
          />
          <select
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            className="shrink-0 rounded-lg border border-black/12 bg-black/[0.03] px-2 py-2.5 text-sm text-ink outline-none focus:border-brand/60"
            aria-label="Assign to"
          >
            <option value="">Unassigned</option>
            {team.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!title.trim() || busy}
            className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors enabled:hover:bg-brand-bright disabled:opacity-40"
          >
            {busy ? "…" : "Add"}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-xs text-brand-bright">{error}</p>}
    </div>
  );
}
