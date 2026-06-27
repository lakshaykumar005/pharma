"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProgressControl({
  taskId,
  initialPct,
  readOnly = false,
  readOnlyNote = "Rolled up from this line's tasks — not directly editable.",
}: {
  taskId: number;
  initialPct: number;
  readOnly?: boolean;
  readOnlyNote?: string;
}) {
  const router = useRouter();
  const [pct, setPct] = useState(initialPct);
  const [committed, setCommitted] = useState(initialPct);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = pct !== committed;

  const fill =
    pct >= 100
      ? "linear-gradient(90deg,#fff,#cfcfcf)"
      : "linear-gradient(90deg,var(--color-brand-bright),var(--color-brand-deep))";

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pct }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Save failed");
      setCommitted(pct);
      setSaved(true);
      router.refresh(); // re-pull server data (rings, status, phase rollup)
      setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-sm">
        <span className="text-mute">Progress</span>
        <span className="display-num text-xl text-ink">{pct}%</span>
      </div>

      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: fill }} />
      </div>

      {readOnly ? (
        <p className="mt-3 text-xs text-faint">{readOnlyNote}</p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-brand"
              aria-label="Set progress"
            />
            <div className="flex gap-1.5">
              {[0, 25, 50, 75, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPct(v)}
                  className={`rounded-md px-2 py-1 font-mono text-[0.6rem] transition-colors ${
                    pct === v ? "bg-brand text-white" : "bg-white/[0.06] text-mute hover:text-ink"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors enabled:hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving…" : dirty ? "Save progress" : "Saved"}
            </button>
            {dirty && !saving && (
              <button
                type="button"
                onClick={() => setPct(committed)}
                className="text-xs text-faint hover:text-ink"
              >
                Reset
              </button>
            )}
            {saved && <span className="text-xs text-brand-bright">✓ Updated in database</span>}
            {error && <span className="text-xs text-brand-bright">{error}</span>}
          </div>
        </>
      )}
    </div>
  );
}
