"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

const textOf = (m: UIMessage) =>
  (m.parts ?? []).filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join("");

export function Assistant({ name, role }: { name: string; role: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  // load this user's saved conversation (cross-session memory) once
  useEffect(() => {
    let on = true;
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => { if (on && Array.isArray(d.messages) && d.messages.length) setMessages(d.messages); })
      .catch(() => {});
    return () => { on = false; };
  }, [setMessages]);

  useEffect(() => {
    if (open) scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, status]);

  const busy = status === "submitted" || status === "streaming";
  const starters =
    role === "VIEWER"
      ? ["What's waiting on my sign-off?", "Summarise overall progress"]
      : role === "EDITOR"
        ? ["What should I work on next?", "What's overdue or blocked for me?"]
        : ["What needs attention?", "What's overdue or blocked?"];

  function submit(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    sendMessage({ text: clean });
    setInput("");
  }

  return (
    <>
      {/* launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-5 right-5 z-[60] grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-[0_16px_40px_-12px_rgba(236,28,43,0.8)] transition-transform hover:scale-105"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        )}
      </button>

      {/* panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[60] flex h-[min(70vh,560px)] w-[min(92vw,400px)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-canvas shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]">
          {/* header */}
          <div className="flex items-center gap-3 border-b border-black/10 bg-paper px-4 py-3 text-paper-ink">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-display text-base text-white">AI</span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Project assistant</p>
              <p className="font-mono text-[0.55rem] uppercase tracking-widest text-zinc-400">Grounded in your live tasks</p>
            </div>
          </div>

          {/* messages */}
          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="rounded-xl border border-black/8 bg-black/[0.02] p-3 text-sm text-mute">
                Hi {name.split(" ")[0]} — ask me about your tasks, deadlines, or what to prioritise.
              </div>
            )}
            {messages.map((m) => {
              const mine = m.role === "user";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      mine ? "bg-brand text-white" : "border border-black/8 bg-black/[0.03] text-ink"
                    }`}
                  >
                    {textOf(m) || (busy ? "…" : "")}
                  </div>
                </div>
              );
            })}
            {busy && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-black/8 bg-black/[0.03] px-3.5 py-2.5 text-sm text-faint">Thinking…</div>
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-brand/30 bg-brand/5 px-3 py-2 text-xs text-brand-bright">
                {/configured/i.test(error.message) ? "Assistant isn't configured yet (missing Gemini API key)." : "Something went wrong — try again."}
              </div>
            )}
          </div>

          {/* starters */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {starters.map((s) => (
                <button key={s} onClick={() => submit(s)} className="rounded-full border border-black/12 px-3 py-1.5 text-xs text-mute transition-colors hover:border-brand/40 hover:text-brand">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* input */}
          <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="flex items-end gap-2 border-t border-black/10 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
              placeholder="Ask about your tasks…"
              rows={1}
              className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-black/12 bg-black/[0.03] px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/60"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white transition-opacity enabled:hover:bg-brand-bright disabled:opacity-40"
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
