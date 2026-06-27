import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/app/lib/cn";

/** Premium CTA: animated shimmer sweep + soft brand glow. Renders a Link if href. */
export function ShimmerButton({
  children,
  href,
  variant = "solid",
  className,
  type,
}: {
  children: ReactNode;
  href?: string;
  variant?: "solid" | "ghost";
  className?: string;
  type?: "button" | "submit";
}) {
  const base = cn(
    "shimmer-btn group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300",
    variant === "solid"
      ? "bg-brand text-white shadow-[0_10px_40px_-12px_rgba(236,28,43,0.8)] hover:shadow-[0_14px_50px_-10px_rgba(236,28,43,0.95)] hover:-translate-y-0.5"
      : "border border-black/15 bg-black/[0.03] text-ink hover:border-brand/50 hover:bg-black/[0.06]",
    className,
  );

  const inner = <span className="relative z-10 inline-flex items-center gap-2">{children}</span>;

  if (href) {
    return (
      <Link href={href} className={base}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type ?? "button"} className={base}>
      {inner}
    </button>
  );
}
