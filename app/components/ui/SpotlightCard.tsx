"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/app/lib/cn";

/** Card with a cursor-following radial spotlight + reactive border glow. */
export function SpotlightCard({
  children,
  className,
  glow = "rgba(236,28,43,0.22)",
}: {
  children: ReactNode;
  className?: string;
  glow?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [active, setActive] = useState(false);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={cn("group relative overflow-hidden rounded-[var(--radius-card)]", className)}
      style={
        {
          "--mx": `${pos.x}%`,
          "--my": `${pos.y}%`,
        } as React.CSSProperties
      }
    >
      {/* spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(420px circle at var(--mx) var(--my), ${glow}, transparent 60%)`,
        }}
      />
      {/* reactive border */}
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-[var(--radius-card)] transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(260px circle at var(--mx) var(--my), rgba(255,255,255,0.14), transparent 45%)`,
          maskImage: "linear-gradient(#000,#000)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: 1,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
