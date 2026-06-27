"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/app/lib/cn";

/** 3D tilt-on-hover card with a moving glare highlight. Respects pointer device. */
export function TiltCard({
  children,
  className,
  max = 9,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setT({
      rx: (0.5 - py) * max * 2,
      ry: (px - 0.5) * max * 2,
      gx: px * 100,
      gy: py * 100,
      active: true,
    });
  }

  return (
    <div className="[perspective:1100px]">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setT((s) => ({ ...s, rx: 0, ry: 0, active: false }))}
        className={cn(
          "relative h-full rounded-[var(--radius-card)] transition-transform duration-200 ease-out [transform-style:preserve-3d] will-change-transform",
          className,
        )}
        style={{ transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)` }}
      >
        <div
          className="pointer-events-none absolute inset-0 z-20 rounded-[var(--radius-card)] transition-opacity duration-300"
          style={{
            opacity: t.active ? 1 : 0,
            background: `radial-gradient(360px circle at ${t.gx}% ${t.gy}%, rgba(0,0,0,0.16), transparent 55%)`,
          }}
        />
        {children}
      </div>
    </div>
  );
}
