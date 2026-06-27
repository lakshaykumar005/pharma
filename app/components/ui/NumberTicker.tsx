"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up to `value` once scrolled into view. */
export function NumberTicker({
  value,
  duration = 1400,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let started = false;

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(value * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (started) return;
      started = true;
      run();
      io?.disconnect();
    };

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([e]) => e.isIntersecting && start(), { threshold: 0.4 })
        : null;
    io?.observe(el);
    if (!io) start();
    const fallback = window.setTimeout(start, 1400); // never leave a "0" visible
    return () => {
      io?.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}
