"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskComment } from "@/app/lib/types";

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
const roleLabel = (r: string) => (r === "ADMIN" ? "Manager" : r === "EDITOR" ? "Engineer" : "Client");
const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export function Comments({
  taskId,
  initial,
  canComment,
  meName,
  meRole,
}: {
  taskId: number;
  initial: TaskComment[];
  canComment: boolean;
  meName: string;
  meRole: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<TaskComment[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((p) => [
        ...p,
        { id: data.id, author: meName, role: meRole, body: clean, createdAt: data.createdAt },
      ]);
      setText("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post comment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <p className="mono-label">Discussion</p>
        {items.length > 0 && <span className="font-mono text-[0.66rem] text-mute">{items.length}</span>}
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((c) => {
          const isClient = c.role === "VIEWER";
          return (
            <li
              key={c.id}
              className={`flex gap-3 ${isClient ? "rounded-xl border border-brand/30 bg-brand/[0.05] p-3" : ""}`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-[0.58rem] ${
                  isClient ? "bg-brand text-white" : "bg-black/[0.06] text-ink"
                }`}
              >
                {initials(c.author)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{c.author}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest ${
                      isClient
                        ? "bg-brand/15 text-brand-bright"
                        : "border border-black/12 text-faint"
                    }`}
                  >
                    {roleLabel(c.role)}
                  </span>
                  <span className="font-mono text-[0.58rem] text-faint">{timeAgo(c.createdAt)}</span>
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/90">{c.body}</p>
              </div>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="rounded-lg border border-dashed border-black/10 px-3 py-5 text-center text-sm text-faint">
            No comments yet.{canComment ? " Start the discussion below." : ""}
          </li>
        )}
      </ul>

      {canComment ? (
        <form onSubmit={submit} className="mt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={meRole === "VIEWER" ? "Share feedback or ask the team a question…" : "Add a note or update…"}
            rows={2}
            maxLength={1000}
            className="w-full resize-y rounded-lg border border-black/12 bg-black/[0.03] px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/60"
          />
          <div className="mt-2 flex items-center justify-between">
            {error ? <span className="text-xs text-brand-bright">{error}</span> : <span />}
            <button
              type="submit"
              disabled={!text.trim() || busy}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors enabled:hover:bg-brand-bright disabled:opacity-40"
            >
              {busy ? "Posting…" : "Comment"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-xs text-faint">Sign in as a manager or engineer to join the discussion.</p>
      )}
    </div>
  );
}
