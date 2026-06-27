import Image from "next/image";
import { getSnapshot } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/auth";
import { Reveal } from "@/app/components/Reveal";
import { ShimmerButton } from "@/app/components/ui/ShimmerButton";
import { SpotlightCard } from "@/app/components/ui/SpotlightCard";
import { TiltCard } from "@/app/components/ui/TiltCard";
import { Marquee } from "@/app/components/ui/Marquee";
import { NumberTicker } from "@/app/components/ui/NumberTicker";
import { Meteors } from "@/app/components/ui/Meteors";
import { ChecklistMock, GanttMock, ProgressMock, RolePills, AvatarStack } from "@/app/components/ui/mocks";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const [{ project, phases, team, departments }, user] = await Promise.all([getSnapshot(), getCurrentUser()]);
  const taskCount = phases.flatMap((p) => p.tasks).filter((t) => t.type === "T").length;
  const ctaHref = user ? "/dashboard" : "/login";
  const ctaLabel = user ? "Open dashboard" : "Sign in to track";

  return (
    <div className="overflow-x-clip">
      {/* ============================ HERO ============================ */}
      <section className="relative">
        <div className="aurora" />
        <Meteors count={12} />
        <div className="pointer-events-none absolute inset-0 bg-dot" />

        <div className="relative mx-auto max-w-[1240px] px-4 pb-10 pt-20 sm:px-6 sm:pt-28">
          <Reveal>
            <div className="flex justify-center">
              <span className="chip border-brand/40 bg-brand/5 text-brand-bright">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-bright animate-[blink_1.6s_ease-in-out_infinite]" />
                Live project transparency · {project.builder}
              </span>
            </div>
          </Reveal>

          <Reveal delay={70}>
            <h1 className="mx-auto mt-7 max-w-5xl text-center font-display text-[clamp(2.9rem,9vw,7rem)] uppercase leading-[0.84] tracking-tight text-ink">
              See <span className="text-gradient-brand">everything</span> we&apos;ve done.
              <br />
              Doing. And about to do.
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-mute sm:text-lg">
              The command center for <strong className="text-ink">{project.client}</strong>&apos;s {project.programme} —
              one place where you watch every workstream, task and milestone move in real time.
            </p>
          </Reveal>

          <Reveal delay={210}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <ShimmerButton href={ctaHref}>
                {ctaLabel} <span aria-hidden>→</span>
              </ShimmerButton>
              <ShimmerButton href="#how" variant="ghost">
                How it works
              </ShimmerButton>
            </div>
          </Reveal>

          {/* hero product preview */}
          <Reveal delay={300}>
            <HeroPreview project={project} phases={phases} taskCount={taskCount} teamCount={team.length} deptCount={departments.length} />
          </Reveal>
        </div>
      </section>

      {/* ============================ HOW — DARK BAND ============================ */}
      <section id="how" className="scroll-mt-24 border-y border-white/5 bg-[#0b0b0d] text-zinc-100">
        <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-brand-bright">How it works</span>
              <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.25rem)] uppercase leading-[0.95] tracking-tight text-zinc-50">
                Past, present and future — on one screen
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Every task lives in one of three states. You always know exactly where the programme stands.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { tag: "Done", title: "What we've delivered", body: "Completed tasks lock in at 100% with a record of who delivered them and when.", icon: IconCheck, accent: false },
              { tag: "Doing", title: "What's in motion now", body: "Live progress, owners and due dates update the moment the team logs work.", icon: IconPulse, accent: true },
              { tag: "Next", title: "What's coming up", body: "Upcoming tasks and dependencies are mapped on the timeline — no surprises.", icon: IconArrow, accent: false },
            ].map((c, i) => (
              <Reveal key={c.tag} delay={i * 90}>
                <div className={`group relative h-full overflow-hidden rounded-[var(--radius-card)] border p-7 transition-colors duration-300 ${c.accent ? "border-brand/50 bg-[#16161b]" : "border-white/10 bg-[#15151a] hover:border-white/20"}`}>
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${c.accent ? "bg-brand text-white shadow-[0_8px_24px_-8px_rgba(236,28,43,0.8)]" : "bg-white/10 text-white"}`}>
                    <c.icon />
                  </span>
                  <p className={`mt-5 font-mono text-[0.62rem] uppercase tracking-[0.2em] ${c.accent ? "text-brand-bright" : "text-zinc-400"}`}>{c.tag}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">{c.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ CONTEXT (real imagery) ============================ */}
      <section className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[28px] bg-brand/15 blur-3xl" />
              <div className="overflow-hidden rounded-[20px] border border-black/12 shadow-2xl">
                <div className="relative aspect-[5/4]">
                  <Image src="/images/lab.jpg" alt="Anthem Biosciences laboratory" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                </div>
              </div>
              {/* floating image chip */}
              <div className="absolute -bottom-5 -right-4 hidden rounded-xl border border-black/10 bg-paper p-3 text-paper-ink shadow-xl sm:block">
                <p className="font-mono text-[0.55rem] uppercase tracking-widest text-zinc-500">On track</p>
                <p className="display-num mt-1 text-2xl">3 lines</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div>
              <span className="mono-label text-brand-bright">Real work · real visibility</span>
              <h2 className="mt-3 font-display text-[clamp(1.9rem,4.5vw,3rem)] uppercase leading-[0.95] tracking-tight text-ink">
                From the lab bench to the live plant
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-mute sm:text-base">
                Anthem&apos;s effluent-treatment demonstration runs across procurement, delivery, installation and
                commissioning. This command center turns that complex programme into a single, honest picture you can
                read in seconds.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                <Stat value={taskCount} label="Tracked tasks" />
                <Stat value={team.length} label="Specialists" />
                <Stat value={departments.length} label="Departments" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section id="features" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 py-12 sm:px-6">
        <SectionHead kicker="Features" title="Built like a project manager thinks" desc="Workstreams, tasks, subtasks, dependencies, milestones and roles — the whole operating picture." />

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          {/* WHITE feature card */}
          <Reveal className="lg:col-span-7">
            <div className="relative h-full overflow-hidden rounded-[var(--radius-card)] bg-paper p-7 text-paper-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-xs">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white"><IconLayers /></span>
                  <h3 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-100">Subtasks & checklists</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    Break any task into a checklist. Tick items off and the task — and its whole workstream —
                    recalculates progress automatically. True bottom-up tracking.
                  </p>
                </div>
                <div className="w-full max-w-[280px]">
                  <ChecklistMock light />
                </div>
              </div>
            </div>
          </Reveal>

          {/* live progress */}
          <Reveal delay={80} className="lg:col-span-5">
            <SpotlightCard className="card h-full">
              <div className="flex h-full flex-col justify-between p-7">
                <div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/12 text-brand-bright"><IconGauge /></span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">Live progress</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mute">Work-day-weighted rollups from task to phase to programme.</p>
                </div>
                <div className="mt-6"><ProgressMock /></div>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* timeline */}
          <Reveal delay={120} className="lg:col-span-7">
            <SpotlightCard className="card h-full">
              <div className="p-7">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand-bright"><IconTimeline /></span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-ink">Dependency-aware timeline</h3>
                    <p className="mt-2 text-sm leading-relaxed text-mute">A real Gantt with finish-to-start chains, planned-vs-actual and a live ‘today’ marker — so slippage shows instantly.</p>
                  </div>
                </div>
                <div className="mt-6"><GanttMock /></div>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* roles */}
          <Reveal delay={160} className="lg:col-span-5">
            <SpotlightCard className="card h-full">
              <div className="flex h-full flex-col justify-between p-7">
                <div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/12 text-brand-bright"><IconShield /></span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">Role-based access</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mute">Admins & editors update; clients view. Every route gated.</p>
                </div>
                <div className="mt-6"><RolePills /></div>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* image banner */}
          <Reveal delay={120} className="lg:col-span-12">
            <div className="group relative h-64 overflow-hidden rounded-[var(--radius-card)] border border-black/10 sm:h-72">
              <Image src="/images/pipes.jpg" alt="On-site installation" fill sizes="100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
              <div className="relative flex h-full max-w-xl flex-col justify-center p-8 sm:p-12">
                <span className="mono-label text-brand-bright">Procurement → commissioning</span>
                <h3 className="mt-3 font-display text-3xl uppercase tracking-tight text-white sm:text-4xl">Tracked at every step on the ground</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">Every delivery, install and trial logged against the plan — with milestones that mean something.</p>
              </div>
            </div>
          </Reveal>

          {/* mini cards */}
          {[
            { icon: IconFlag, title: "Milestones", body: "Every line drives to a dated, commissioned milestone." },
            { icon: IconUsers, title: "Team & departments", body: "See who owns what across five departments.", stack: true },
            { icon: IconDevice, title: "Every screen", body: "Phone, tablet, laptop, command-room display — pixel-perfect." },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 80} className="lg:col-span-4">
              <SpotlightCard className="card h-full">
                <div className="flex h-full flex-col p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12 text-brand-bright"><c.icon /></span>
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-ink">{c.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-mute">{c.body}</p>
                  {c.stack && <div className="mt-4"><AvatarStack /></div>}
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================ MARQUEE ============================ */}
      <section className="relative border-y border-black/8 bg-black/[0.015] py-6">
        <Marquee duration={32}>
          {["Procurement", "Delivery", "Installation", "Commissioning", "SCADA", "Membrane skid", "Sensors", "Demo-trial", "Milestones", "Dependencies", "Real-time", "Transparency"].map((w) => (
            <span key={w} className="mx-6 inline-flex items-center gap-3 font-display text-2xl uppercase tracking-wide text-black/15">
              {w}<span className="h-1.5 w-1.5 rounded-full bg-brand/60" />
            </span>
          ))}
        </Marquee>
      </section>

      {/* ============================ ROLES ============================ */}
      <section id="roles" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 py-20 sm:px-6">
        <SectionHead kicker="For your team" title="One tool, every perspective" desc="From the client's boardroom view to the engineer's task checklist — everyone gets what they need." />

        <Reveal>
          <div className="group relative mt-12 h-44 overflow-hidden rounded-[var(--radius-card)] border border-black/10 sm:h-52">
            <Image src="/images/water.jpg" alt="Engineering design & planning" fill sizes="100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />
            <div className="absolute bottom-0 p-6 sm:p-8">
              <span className="mono-label text-brand-bright">Design · Project · Service · Simulation · A&amp;P</span>
              <p className="mt-2 max-w-lg font-display text-2xl uppercase tracking-tight text-white sm:text-3xl">Engineered transparency for every discipline</p>
            </div>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { role: "Clients", body: "A confident, real-time read on the whole programme — no chasing, no spreadsheets.", points: ["Live overall progress", "Milestone countdowns", "Read-only & secure"] },
            { role: "Project managers", body: "Plan, assign and track from one board. Break work into subtasks and watch rollups update.", points: ["Create & assign tasks", "Subtask checklists", "Dependency timeline"] },
            { role: "Engineers", body: "Know exactly what's yours and what's next. Update progress in two taps on site.", points: ["My tasks & owners", "Quick progress updates", "Mobile-first"] },
          ].map((r, i) => (
            <Reveal key={r.role} delay={i * 90}>
              <TiltCard className="h-full" max={6}>
                <SpotlightCard className="card h-full">
                  <div className="flex h-full flex-col p-7">
                    <h3 className="text-lg font-semibold tracking-tight text-ink">{r.role}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-mute">{r.body}</p>
                    <ul className="mt-5 space-y-2">
                      {r.points.map((p) => (
                        <li key={p} className="flex items-center gap-2.5 text-sm text-ink/90">
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-brand/15 text-brand-bright"><IconCheck small /></span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </SpotlightCard>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================ CTA — white ============================ */}
      <section className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="relative grid items-center gap-8 overflow-hidden rounded-[24px] bg-paper p-8 text-paper-ink shadow-[0_40px_120px_-50px_rgba(236,28,43,0.45)] sm:p-12 lg:grid-cols-[1.4fr_1fr]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/20 blur-[70px]" />
            <div className="relative">
              <span className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-brand">Get started</span>
              <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.5rem)] uppercase leading-[0.9] tracking-tight text-zinc-100">
                Full visibility starts here
              </h2>
              <p className="mt-4 max-w-md text-sm text-zinc-500 sm:text-base">
                Sign in to follow {project.client}&apos;s programme in real time — every task, every day.
              </p>
              <div className="mt-7">
                <ShimmerButton href={ctaHref}>
                  {ctaLabel} <span aria-hidden>→</span>
                </ShimmerButton>
              </div>
            </div>
            <div className="hidden justify-self-end lg:block">
              <div className="w-[260px] rounded-2xl border border-white/10 bg-paper p-1.5 shadow-xl">
                <div className="rounded-xl bg-zinc-950 p-4">
                  <ChecklistMock light />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

/* ------------------------------- hero preview ---------------------------- */

function HeroPreview({
  project,
  taskCount,
  teamCount,
  deptCount,
}: {
  project: { end: string };
  phases: unknown[];
  taskCount: number;
  teamCount: number;
  deptCount: number;
}) {
  return (
    <div className="relative mx-auto mt-16 max-w-4xl">
      <div className="pointer-events-none absolute -inset-x-10 -top-12 -z-10 h-48 rounded-full bg-brand/20 blur-[80px]" />
      <div className="rounded-2xl border border-black/12 bg-gradient-to-b from-panel to-canvas-2 p-2.5 shadow-[0_50px_140px_-50px_rgba(236,28,43,0.55)]">
        {/* browser chrome */}
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
          <span className="ml-3 hidden rounded-md bg-black/[0.05] px-3 py-1 font-mono text-[0.6rem] text-faint sm:block">
            anthem-command-center / dashboard
          </span>
          <span className="ml-auto chip border-brand/40 text-brand-bright">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-bright animate-[blink_1.6s_ease-in-out_infinite]" /> Live
          </span>
        </div>
        {/* mini dashboard */}
        <div className="rounded-xl border border-black/8 bg-canvas/70 p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Days to go" value="39" />
            <MiniStat label="Programme day" value="9" />
            <MiniStat label="Overall" value="26%" white />
            <MiniStat label="Lines" value="3" accent />
          </div>
          <div className="mt-3"><GanttMock /></div>
        </div>
      </div>

      {/* floating white card */}
      <div className="absolute -bottom-6 left-3 hidden rounded-xl bg-paper p-3 text-paper-ink shadow-2xl sm:flex sm:items-center sm:gap-3">
        <Ring26 />
        <div>
          <p className="font-mono text-[0.5rem] uppercase tracking-widest text-zinc-500">Overall progress</p>
          <p className="display-num text-xl leading-none">26%</p>
        </div>
      </div>
      <span className="sr-only">{`${project.end} ${taskCount} ${teamCount} ${deptCount}`}</span>
    </div>
  );
}

function Ring26() {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <svg width="40" height="40" className="-rotate-90">
      <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="5" />
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-brand)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${0.26 * c} ${c}`} />
    </svg>
  );
}

function MiniStat({ label, value, accent, white }: { label: string; value: string; accent?: boolean; white?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${white ? "border-transparent bg-paper text-paper-ink" : "border-black/8 bg-black/[0.02]"}`}>
      <p className={`font-mono text-[0.5rem] uppercase tracking-widest ${white ? "text-zinc-500" : "text-faint"}`}>{label}</p>
      <p className={`display-num mt-1.5 text-2xl ${white ? "text-paper-ink" : accent ? "text-brand" : "text-ink"}`}>{value}</p>
    </div>
  );
}

/* ------------------------------- pieces ---------------------------------- */

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-black/8 bg-black/[0.02] px-4 py-5 text-center">
      <p className="display-num text-3xl text-ink"><NumberTicker value={value} /></p>
      <p className="mono-label mt-2 text-[0.52rem]">{label}</p>
    </div>
  );
}

function SectionHead({ kicker, title, desc }: { kicker: string; title: string; desc: string }) {
  return (
    <Reveal>
      <div className="mx-auto max-w-2xl text-center">
        <span className="mono-label text-brand-bright">{kicker}</span>
        <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.25rem)] uppercase leading-[0.95] tracking-tight text-ink">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">{desc}</p>
      </div>
    </Reveal>
  );
}

/* ------------------------------- icons ----------------------------------- */
/* eslint-disable @typescript-eslint/no-explicit-any */
const S = (p: any) => ({ width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...p });
function IconCheck({ small }: { small?: boolean }) { return <svg {...S({ width: small ? 12 : 20, height: small ? 12 : 20 })}><path d="M20 6 9 17l-5-5" /></svg>; }
function IconPulse() { return <svg {...S({})}><path d="M3 12h4l2 6 4-12 2 6h6" /></svg>; }
function IconArrow() { return <svg {...S({})}><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function IconLayers() { return <svg {...S({})}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></svg>; }
function IconGauge() { return <svg {...S({})}><path d="M12 14 17 9" /><path d="M3 12a9 9 0 1 1 18 0" /><circle cx="12" cy="14" r="1.5" /></svg>; }
function IconShield() { return <svg {...S({})}><path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>; }
function IconTimeline() { return <svg {...S({})}><path d="M3 6h12M3 12h16M3 18h9" /><circle cx="18" cy="6" r="1.6" /><circle cx="20" cy="12" r="1.6" /><circle cx="13" cy="18" r="1.6" /></svg>; }
function IconFlag() { return <svg {...S({})}><path d="M5 22V4M5 4h11l-2 4 2 4H5" /></svg>; }
function IconUsers() { return <svg {...S({})}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6" /></svg>; }
function IconDevice() { return <svg {...S({})}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>; }
