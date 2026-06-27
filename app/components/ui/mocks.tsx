/* Lightweight product-preview mockups (pure CSS/SVG) used inside landing cards.
   They mirror the real product UI so the feature cards feel concrete + premium. */

export function ChecklistMock({ light = false }: { light?: boolean }) {
  const rows: [string, boolean][] = [
    ["Prepare foundation & utilities", true],
    ["Position demo-plant skid", true],
    ["Connect piping & power", false],
    ["Pre-commissioning checks", false],
  ];
  const line = light ? "border-black/10" : "border-white/10";
  const sub = light ? "bg-black/[0.03]" : "bg-white/[0.03]";
  const text = light ? "text-zinc-700" : "text-ink/85";
  const muted = light ? "text-zinc-400" : "text-faint";
  return (
    <div className={`rounded-xl border ${line} ${light ? "bg-white" : "bg-canvas/60"} p-3.5 shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className={`text-[0.72rem] font-semibold ${light ? "text-zinc-800" : "text-ink"}`}>
          Demo-plant installation
        </span>
        <span className={`font-mono text-[0.6rem] ${muted}`}>2/4 · 50%</span>
      </div>
      <div className={`mt-2 h-1.5 w-full overflow-hidden rounded-full ${light ? "bg-black/8" : "bg-white/10"}`}>
        <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-brand-bright to-brand-deep" />
      </div>
      <ul className="mt-3 space-y-1.5">
        {rows.map(([label, done]) => (
          <li key={label} className={`flex items-center gap-2.5 rounded-md border ${line} ${sub} px-2.5 py-1.5`}>
            <span
              className={`grid h-4 w-4 place-items-center rounded border ${
                done ? "border-brand bg-brand text-white" : light ? "border-black/20" : "border-white/25"
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
  const bars = [
    { left: 4, width: 18, tone: "done" },
    { left: 4, width: 14, tone: "done" },
    { left: 30, width: 22, tone: "live" },
    { left: 48, width: 26, tone: "up" },
    { left: 70, width: 20, tone: "up" },
  ];
  const fill = (t: string) =>
    t === "done"
      ? "linear-gradient(90deg,#fff,#cfcfcf)"
      : t === "live"
        ? "linear-gradient(90deg,var(--color-brand-bright),var(--color-brand-deep))"
        : "transparent";
  return (
    <div className="rounded-xl border border-white/10 bg-canvas/60 p-3.5">
      <div className="flex items-center justify-between text-[0.58rem] font-mono uppercase tracking-widest text-faint">
        <span>Programme timeline</span>
        <span className="text-brand-bright">Today</span>
      </div>
      <div className="relative mt-3 space-y-2">
        <span className="absolute bottom-0 top-0 z-0 w-px bg-brand-bright/60" style={{ left: "44%" }} />
        {bars.map((b, i) => (
          <div key={i} className="relative h-3.5">
            <span
              className="absolute top-0 h-full rounded-[4px] border"
              style={{
                left: `${b.left}%`,
                width: `${b.width}%`,
                background: fill(b.tone),
                borderColor: b.tone === "up" ? "rgba(255,255,255,0.18)" : b.tone === "live" ? "rgba(236,28,43,0.5)" : "rgba(255,255,255,0.25)",
              }}
            />
          </div>
        ))}
        <span className="absolute h-3 w-3 rotate-45 rounded-[2px] bg-brand" style={{ left: "92%", top: "62%" }} />
      </div>
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
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
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
            can ? "border-brand/40 bg-brand/10 text-brand-bright" : "border-white/12 text-faint"
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
  const tones = ["bg-brand text-white", "bg-white/15 text-ink", "bg-white/15 text-ink", "bg-white/15 text-ink", "bg-white/15 text-ink"];
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
