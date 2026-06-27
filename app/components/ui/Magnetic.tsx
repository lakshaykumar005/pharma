"use client";

import { useRef, useState, type ReactNode } from "react";

/** Wraps content so it gently follows the cursor (magnetic hover). */
export function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [d, setD] = useState({ x: 0, y: 0 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setD({
      x: (e.clientX - (r.left + r.width / 2)) * strength,
      y: (e.clientY - (r.top + r.height / 2)) * strength,
    });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setD({ x: 0, y: 0 })}
      className="inline-block transition-transform duration-200 ease-out will-change-transform"
      style={{ transform: `translate(${d.x}px, ${d.y}px)` }}
    >
      {children}
    </div>
  );
}
