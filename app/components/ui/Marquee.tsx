import type { ReactNode } from "react";
import { cn } from "@/app/lib/cn";

/** Infinite horizontal marquee. Duplicates children for a seamless loop. */
export function Marquee({
  children,
  className,
  duration = 28,
  reverse = false,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
  reverse?: boolean;
}) {
  return (
    <div
      className={cn("group flex overflow-hidden [--gap:2rem]", className)}
      style={{ gap: "var(--gap)" }}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          className="flex shrink-0 items-center [gap:var(--gap)] group-hover:[animation-play-state:paused]"
          style={{
            gap: "var(--gap)",
            animation: `marquee ${duration}s linear infinite`,
            animationDirection: reverse ? "reverse" : "normal",
          }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
