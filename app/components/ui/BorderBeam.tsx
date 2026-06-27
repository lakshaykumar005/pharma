/** A light "beam" that travels around the element's border. Place inside a
    `relative` rounded container. */
export function BorderBeam({
  duration = 7,
  size = 90,
  delay = 0,
}: {
  duration?: number;
  size?: number;
  delay?: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <span
        className="absolute aspect-square rounded-full"
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          animation: `border-beam ${duration}s linear ${delay}s infinite`,
          background:
            "radial-gradient(circle, var(--color-brand-bright) 0%, rgba(236,28,43,0.4) 35%, transparent 70%)",
        }}
      />
    </div>
  );
}
