export function ProgressRing({
  value,
  size = 96,
  stroke = 8,
  label,
}: {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * c;
  const id = `grad-${size}-${Math.round(value)}`;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-bright)" />
            <stop offset="100%" stopColor="var(--color-brand-deep)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="display-num text-ink" style={{ fontSize: size * 0.34 }}>
          {Math.round(value)}
          <span className="text-mute" style={{ fontSize: size * 0.16 }}>
            %
          </span>
        </span>
        {label && <span className="mono-label mt-0.5 text-[0.52rem]">{label}</span>}
      </div>
    </div>
  );
}
