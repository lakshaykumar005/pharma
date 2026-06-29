"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskState } from "@/app/lib/types";

const OPTS: { value: TaskState; label: string; on: string }[] = [
  { value: "ACTIVE", label: "Active", on: "bg-ink text-white border-ink" },
  { value: "BLOCKED", label: "Blocked", on: "bg-brand text-white border-brand" },
  { value: "ON_HOLD", label: "On hold", on: "bg-amber-500 text-white border-amber-500" },
];

export function StateControl({
  taskId,
  initial,
  canEdit,
}: {
  taskId: number;
  initial: TaskState;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<TaskState>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function set(v: TaskState) {
    if (!canEdit || busy || v === state) return;
    const prev = state;
    setState(v);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: v }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setState(prev);
      setError("Couldn't update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <p className="mono-label mb-2">Working state</p>
      {canEdit ? (
        <div className="inline-flex overflow-hidden rounded-lg border border-black/12">
          {OPTS.map((o, i) => (
            <button
              key={o.value}
              type="button"
              onClick={() => set(o.value)}
              disabled={busy}
              className={`px-3.5 py-2 text-xs font-semibold transition-colors ${i ? "border-l border-black/10" : ""} ${
                state === o.value ? o.on : "bg-transparent text-mute hover:text-ink"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <span className="text-sm text-mute">
          {state === "BLOCKED" ? "Blocked" : state === "ON_HOLD" ? "On hold" : "Active"}
        </span>
      )}
      {error && <span className="ml-3 text-xs text-brand">{error}</span>}
    </div>
  );
}
