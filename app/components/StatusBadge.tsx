import { type Status } from "@/app/lib/helpers";

const STYLES: Record<Status, string> = {
  Complete: "border-black/25 text-ink bg-black/[0.06]",
  "In progress": "border-brand/60 text-brand-bright bg-brand/10",
  Active: "border-brand/60 text-brand-bright bg-brand/10",
  Upcoming: "border-black/12 text-faint bg-black/[0.02]",
  Overdue: "border-transparent text-white bg-brand",
  Blocked: "border-transparent text-white bg-brand",
  "On hold": "border-amber-500/50 text-amber-700 bg-amber-500/10",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${STYLES[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "Complete"
            ? "bg-ink"
            : status === "Upcoming"
              ? "bg-faint"
              : "bg-current"
        } ${status === "In progress" || status === "Active" ? "animate-[blink_1.6s_ease-in-out_infinite]" : ""}`}
      />
      {status}
    </span>
  );
}
