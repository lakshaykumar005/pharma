/* Lightweight product-preview mockups (pure CSS/SVG) used inside landing cards.
   They mirror the real product UI so the feature cards feel concrete + premium. */

export function ChecklistMock({ light = false }: { light?: boolean }) {
  const rows: [string, boolean][] = [
    ["Prepare foundation & utilities", true],
    ["Position demo-plant skid", true],
    ["Connect piping & power", false],
    ["Pre-commissioning checks", false],
  ];
  const line = light ? "border-white/10" : "border-black/10";
  const sub = light ? "bg-white/[0.03]" : "bg-black/[0.03]";
  const text = light ? "text-zinc-300" : "text-ink/85";
  const muted = light ? "text-zinc-600" : "text-faint";
  return (
    <div className={`rounded-xl border ${line} ${light ? "bg-paper" : "bg-canvas/60"} p-3.5 shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className={`text-[0.72rem] font-semibold ${light ? "text-zinc-200" : "text-ink"}`}>
          Demo-plant installation
        </span>
        <span className={`font-mono text-[0.6rem] ${muted}`}>2/4 · 50%</span>
      </div>
      <div className={`mt-2 h-1.5 w-full overflow-hidden rounded-full ${light ? "bg-white/8" : "bg-black/10"}`}>
        <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-brand-bright to-brand-deep" />
      </div>
      <ul className="mt-3 space-y-1.5">
        {rows.map(([label, done]) => (
          <li key={label} className={`flex items-center gap-2.5 rounded-md border ${line} ${sub} px-2.5 py-1.5`}>
            <span
              className={`grid h-4 w-4 place-items-center rounded border ${
                done ? "border-brand bg-brand text-white" : light ? "border-white/20" : "border-black/25"
              }`}
            >
              {done && (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </span>
            <span className={`text-[0.72rem] ${done ? `line-through ${muted}` : text}`}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GanttMock() {
  const today = 44;
  const rows: {
    name: string;
    dot: string;
    left: number;
    width: number;
    tone: "done" | "live" | "up";
    pct?: string;
    milestone?: boolean;
  }[] = [
    { name: "Procurement", dot: "bg-zinc-800", left: 1, width: 17, tone: "done", pct: "100%" },
    { name: "Delivery", dot: "bg-brand", left: 1, width: 13, tone: "done", pct: "100%" },
    { name: "Installation", dot: "bg-brand", left: 22, width: 26, tone: "live", pct: "60%" },
    { name: "Demo-trial", dot: "bg-zinc-400", left: 48, width: 27, tone: "up" },
    { name: "Commissioning", dot: "bg-brand-bright", left: 74, width: 16, tone: "up", milestone: true },
  ];

  const barClass = (t: "done" | "live" | "up") =>
    t === "done"
      ? "bg-gradient-to-b from-zinc-700 to-zinc-900"
      : t === "live"
        ? "bg-gradient-to-r from-brand-bright to-brand-deep shadow-[0_4px_14px_-3px_rgba(236,28,43,0.6)]"
        : "bg-black/[0.06] ring-1 ring-inset ring-black/10";

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      {/* header */}
      <div className="flex items-center justify-between border-b border-black/[0.07] px-4 py-2.5">
        <span className="font-mono text-[0.56rem] uppercase tracking-[0.18em] text-faint">Programme timeline</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[0.56rem] uppercase tracking-[0.18em] text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-[blink_1.6s_ease-in-out_infinite]" />
          Today
        </span>
      </div>

      {/* month axis */}
      <div className="grid grid-cols-[96px_1fr] border-b border-black/[0.06] bg-black/[0.015]">
        <div className="border-r border-black/[0.06]" />
        <div className="relative h-6">
          {[
            ["Jun", 4],
            ["Jul", 38],
            ["Aug", 78],
          ].map(([m, x]) => (
            <span
              key={m as string}
              className="absolute top-1/2 -translate-y-1/2 font-mono text-[0.52rem] uppercase tracking-[0.2em] text-faint"
              style={{ left: `${x}%` }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* rows */}
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[96px_1fr] border-b border-black/[0.05] last:border-0">
          {/* label */}
          <div className="flex items-center gap-1.5 border-r border-black/[0.06] px-2.5 py-2.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.dot}`} />
            <span className="truncate font-mono text-[0.56rem] text-mute">{r.name}</span>
          </div>
          {/* track */}
          <div className="relative h-9">
            {/* month gridlines */}
            {[33, 66].map((x) => (
              <span key={x} className="absolute inset-y-0 w-px bg-black/[0.04]" style={{ left: `${x}%` }} />
            ))}
            {/* today line (continuous across rows) */}
            <span className="absolute inset-y-0 z-10 w-px bg-brand/70" style={{ left: `${today}%` }}>
              {i === 0 && (
                <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-brand shadow-[0_0_0_3px_rgba(236,28,43,0.18)]" />
              )}
            </span>
            {/* bar */}
            <span
              className={`absolute top-1/2 flex h-3.5 -translate-y-1/2 items-center justify-end overflow-hidden rounded-[5px] ${barClass(r.tone)}`}
              style={{ left: `${r.left}%`, width: `${r.width}%` }}
            >
              {r.tone !== "up" && <span className="absolute inset-x-0 top-0 h-1/2 bg-white/15" />}
              {r.pct && (
                <span className="relative z-10 pr-1.5 font-mono text-[0.5rem] text-white/85">{r.pct}</span>
              )}
            </span>
            {/* milestone */}
            {r.milestone && (
              <span
                className="absolute top-1/2 z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px] bg-brand ring-2 ring-white shadow-[0_0_0_3px_rgba(236,28,43,0.15)]"
                style={{ left: `${r.left + r.width + 5}%` }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProgressMock() {
  const heights = [40, 62, 55, 78, 90];
  return (
    <div className="flex items-end gap-3">
      <Ring value={72} />
      <div className="flex h-16 items-end gap-1.5">
        {heights.map((h, i) => (
          <span
            key={i}
            className="w-2 rounded-t bg-gradient-to-t from-brand-deep to-brand-bright"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-brand)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} />
      </svg>
      <span className="display-num absolute inset-0 grid place-items-center text-lg text-ink">{value}%</span>
    </div>
  );
}

export function RolePills() {
  const roles: [string, boolean][] = [["Admin", true], ["Editor", true], ["Viewer", false]];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {roles.map(([r, can]) => (
        <span
          key={r}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.62rem] ${
            can ? "border-brand/40 bg-brand/10 text-brand-bright" : "border-black/12 text-faint"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${can ? "bg-brand-bright" : "bg-faint"}`} />
          {r}
          <span className="opacity-60">{can ? "edit" : "view"}</span>
        </span>
      ))}
    </div>
  );
}

export function AvatarStack() {
  const people = ["KG", "RK", "KR", "SP", "BH"];
  const tones = ["bg-brand text-white", "bg-black/15 text-ink", "bg-black/15 text-ink", "bg-black/15 text-ink", "bg-black/15 text-ink"];
  return (
    <div className="flex items-center">
      {people.map((p, i) => (
        <span
          key={p}
          className={`grid h-9 w-9 place-items-center rounded-full border-2 border-canvas font-mono text-[0.6rem] ${tones[i]}`}
          style={{ marginLeft: i ? -10 : 0, zIndex: people.length - i }}
        >
          {p}
        </span>
      ))}
      <span className="ml-2 font-mono text-[0.62rem] text-faint">+1 dept lead</span>
    </div>
  );
}
