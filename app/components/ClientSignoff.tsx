"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Approval } from "@/app/lib/types";

export function ClientSignoff({
  taskId,
  initial,
  by,
  note: initialNote,
  at,
  canSignoff,
}: {
  taskId: number;
  initial: Approval;
  by: string | null;
  note: string | null;
  at: string | null;
  canSignoff: boolean;
}) {
  const router = useRouter();
  const [approval, setApproval] = useState<Approval>(initial);
  const [savedBy, setSavedBy] = useState(by);
  const [savedNote, setSavedNote] = useState(initialNote);
  const [savedAt, setSavedAt] = useState(at);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(decision: Approval, noteText = "") {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approval: decision, note: noteText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApproval(decision);
      setSavedBy(decision ? "you" : null);
      setSavedNote(decision === "CHANGES" ? noteText : null);
      setSavedAt(decision ? new Date().toISOString() : null);
      setShowNote(false);
      setNote("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save sign-off");
    } finally {
      setBusy(false);
    }
  }

  const fmtAt = savedAt
    ? new Date(savedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <p className="mono-label">Client sign-off</p>
        <StatusPill approval={approval} />
      </div>

      {/* current status */}
      <div className="mt-4 rounded-xl border border-black/8 bg-black/[0.02] p-4">
        {approval === "APPROVED" ? (
          <p className="text-sm text-mute">
            <span className="font-semibold text-ink">Approved</span> by {savedBy}
            {fmtAt ? ` · ${fmtAt}` : ""}. This deliverable is signed off by the client.
          </p>
        ) : approval === "CHANGES" ? (
          <div className="text-sm text-mute">
            <p>
              <span className="font-semibold text-brand-bright">Changes requested</span> by {savedBy}
              {fmtAt ? ` · ${fmtAt}` : ""}.
            </p>
            {savedNote && <p className="mt-1.5 whitespace-pre-wrap text-ink/90">“{savedNote}”</p>}
          </div>
        ) : (
          <p className="text-sm text-mute">
            {canSignoff
              ? "Review this deliverable and record your decision below."
              : "Awaiting the client's review."}
          </p>
        )}
      </div>

      {/* client actions */}
      {canSignoff && (
        <>
          {!showNote ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => send("APPROVED")}
                disabled={busy || approval === "APPROVED"}
                className="inline-flex items-center gap-2 rounded-lg bg-paper px-4 py-2 text-sm font-semibold text-paper-ink transition-opacity enabled:hover:opacity-90 disabled:opacity-40"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => setShowNote(true)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg border border-brand/40 px-4 py-2 text-sm font-semibold text-brand-bright transition-colors hover:bg-brand/10 disabled:opacity-40"
              >
                Request changes
              </button>
              {approval && (
                <button
                  onClick={() => send(null)}
                  disabled={busy}
                  className="ml-auto text-xs text-faint transition-colors hover:text-ink"
                >
                  Clear
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What needs to change? (optional)"
                rows={2}
                maxLength={500}
                className="w-full resize-y rounded-lg border border-black/12 bg-black/[0.03] px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/60"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => send("CHANGES", note.trim())}
                  disabled={busy}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors enabled:hover:bg-brand-bright disabled:opacity-40"
                >
                  {busy ? "Sending…" : "Send request"}
                </button>
                <button
                  onClick={() => { setShowNote(false); setNote(""); }}
                  disabled={busy}
                  className="text-xs text-faint hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {error && <p className="mt-2 text-xs text-brand-bright">{error}</p>}
        </>
      )}
    </div>
  );
}

function StatusPill({ approval }: { approval: Approval }) {
  if (approval === "APPROVED")
    return <span className="chip border-black/15 text-ink">✓ Approved</span>;
  if (approval === "CHANGES")
    return <span className="chip border-brand/50 bg-brand/10 text-brand-bright">⟳ Changes requested</span>;
  return <span className="chip">Awaiting review</span>;
}
