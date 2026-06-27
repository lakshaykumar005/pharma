/** Decorative meteor shower (deterministic positions — SSR-safe, no Math.random in render). */
export function Meteors({ count = 16 }: { count?: number }) {
  const items = Array.from({ length: count }, (_, i) => {
    const left = (i * 97) % 100; // pseudo-spread, stable across SSR/CSR
    const delay = (i % 8) * 0.6;
    const dur = 4 + ((i * 7) % 6);
    return { left, delay, dur, i };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((m) => (
        <span
          key={m.i}
          className="absolute top-0 h-0.5 w-0.5 rotate-[215deg] rounded-full bg-brand-bright shadow-[0_0_0_1px_rgba(255,49,66,0.1)]"
          style={{
            left: `${m.left}%`,
            animation: `meteor ${m.dur}s linear ${m.delay}s infinite`,
          }}
        >
          <span className="absolute top-1/2 h-px w-[60px] -translate-y-1/2 bg-gradient-to-r from-brand-bright to-transparent" />
        </span>
      ))}
    </div>
  );
}
