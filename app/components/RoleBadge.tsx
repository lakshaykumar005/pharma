import { type RoleCode } from "@/app/lib/types";

const DOT: Record<RoleCode, string> = {
  DES: "bg-paper",
  PRO: "bg-brand",
  "A&P": "bg-mute",
  SER: "bg-brand-bright",
  SIM: "bg-faint",
};

export function RoleBadge({
  code,
  size = "sm",
}: {
  code: RoleCode;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/14 font-mono uppercase tracking-widest text-mute ${
        size === "md" ? "px-2.5 py-1 text-[0.66rem]" : "px-2 py-0.5 text-[0.6rem]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[code]}`} />
      {code}
    </span>
  );
}
