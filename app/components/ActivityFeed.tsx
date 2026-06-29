import Link from "next/link";
import { type ActivityRow } from "@/app/lib/activity";

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function ActivityFeed({ items }: { items: ActivityRow[] }) {
  if (items.length === 0) {
    return (
      <div className="card p-6 text-sm text-faint">
        No activity recorded yet — task updates, completions and assignments will appear here as the
        team works.
      </div>
    );
  }

  return (
    <div className="card p-2 sm:p-3">
      <ul className="relative">
        {items.map((a, i) => {
          const Inner = (
            <>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/[0.06] font-mono text-[0.58rem] text-ink">
                {initials(a.actor)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-sm text-ink/90">
                  <strong className="font-semibold text-ink">{a.actor}</strong> {a.verb}{" "}
                  <span className="text-ink">“{a.target}”</span>
                  {a.detail ? <span className="text-mute"> {a.detail}</span> : null}
                </span>
                <span className="mt-0.5 block font-mono text-[0.6rem] uppercase tracking-widest text-faint">
                  {timeAgo(a.createdAt)}
                </span>
              </span>
            </>
          );
          const base =
            "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors" +
            (i % 2 ? " bg-black/[0.015]" : "");
          return (
            <li key={a.id}>
              {a.taskId ? (
                <Link href={`/task/${a.taskId}`} className={`${base} hover:bg-black/[0.04]`}>
                  {Inner}
                </Link>
              ) : (
                <div className={base}>{Inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
