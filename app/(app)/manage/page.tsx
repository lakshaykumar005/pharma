import { redirect } from "next/navigation";
import { requireUser, canManage } from "@/app/lib/auth";
import {
  getProject,
  getPhases,
  getDepartments,
  getTeamWithIds,
  getAllTasks,
  getUsers,
} from "@/app/lib/queries";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  createMemberAction,
  deleteMemberAction,
  createUserAction,
  setUserAccessAction,
  deleteUserAction,
  updateProjectAction,
  createPhaseAction,
  updatePhaseAction,
  deletePhaseAction,
  movePhaseAction,
} from "@/app/lib/admin-actions";
import { fmtShort } from "@/app/lib/helpers";
import { DesignationPicker } from "@/app/components/DesignationPicker";
import type { RoleCode } from "@/app/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage — Command Center" };

const input =
  "w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/60";
const label = "mono-label mb-1 block text-[0.55rem]";
const primaryBtn =
  "inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-bright disabled:opacity-40";
const ghostBtn =
  "inline-flex items-center justify-center rounded-lg border border-black/12 px-3 py-2 text-xs font-medium text-mute transition-colors hover:border-brand/40 hover:text-brand";

export default async function ManagePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser("/manage");
  if (!canManage(user.role)) redirect("/dashboard");
  const isAdmin = true; // manager-only page

  const [project, phases, departments, team, tasks, users, sp] = await Promise.all([
    getProject(),
    getPhases(),
    getDepartments(),
    getTeamWithIds(),
    getAllTasks(),
    isAdmin ? getUsers() : Promise.resolve([]),
    searchParams,
  ]);
  const realTasks = tasks.filter((t) => t.type === "T");

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <header>
        <span className="mono-label text-brand-bright">Admin · {user.role}</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Manage programme
        </h1>
        <p className="mt-2 text-sm text-mute">
          Create &amp; assign tasks, onboard the team{isAdmin ? ", manage access and project settings" : ""}.
        </p>
      </header>

      {(sp.ok || sp.error) && (
        <div
          className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
            sp.error ? "border-brand/40 bg-brand/10 text-brand-bright" : "border-black/15 bg-black/[0.04] text-ink"
          }`}
        >
          {sp.error ?? sp.ok}
        </div>
      )}

      {/* ============================ PHASES ============================ */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink">Phases &amp; plan</h2>
        <p className="mt-1 text-xs text-mute">
          Workstreams that organise the whole programme — the Gantt, plan board and tasks all group by phase.
        </p>

        {/* create phase */}
        <form action={createPhaseAction} className="card mt-3 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-1">
            <label className={label}>Code</label>
            <input name="code" required placeholder="PH-04" className={input} />
          </div>
          <div className="sm:col-span-1 lg:col-span-2">
            <label className={label}>Phase name</label>
            <input name="name" required placeholder="e.g. Sludge Handling" className={input} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={label}>Milestone label</label>
            <input name="subtitle" placeholder="e.g. Sludge line commissioned" className={input} />
          </div>
          <div className="lg:col-span-2">
            <label className={label}>Start</label>
            <input name="startDate" type="date" required defaultValue={project.start} className={input} />
          </div>
          <div className="lg:col-span-2">
            <label className={label}>End</label>
            <input name="endDate" type="date" required defaultValue={project.end} className={input} />
          </div>
          <div className="flex items-end lg:col-span-2">
            <button type="submit" className={primaryBtn}>+ Add phase</button>
          </div>
        </form>

        {/* phase list */}
        <div className="card mt-3 divide-y divide-black/8 p-0">
          {phases.map((p, i) => {
            const tcount = p.tasks.filter((t) => t.type === "T").length;
            return (
              <div key={p.code} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[0.62rem] text-brand-bright">{p.code}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
                    <span className="block truncate text-xs text-mute">
                      ◆ {p.subtitle} · {fmtShort(p.start)}–{fmtShort(p.end)} · {tcount} task{tcount === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-black/8">
                      <span className="block h-full rounded-full bg-brand" style={{ width: `${p.pct}%` }} />
                    </span>
                    <span className="w-9 text-right font-mono text-xs text-ink">{p.pct}%</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <form action={movePhaseAction}>
                      <input type="hidden" name="code" value={p.code} />
                      <input type="hidden" name="dir" value="up" />
                      <button className={ghostBtn} type="submit" aria-label="Move up" disabled={i === 0}>↑</button>
                    </form>
                    <form action={movePhaseAction}>
                      <input type="hidden" name="code" value={p.code} />
                      <input type="hidden" name="dir" value="down" />
                      <button className={ghostBtn} type="submit" aria-label="Move down" disabled={i === phases.length - 1}>↓</button>
                    </form>
                    <form action={deletePhaseAction}>
                      <input type="hidden" name="code" value={p.code} />
                      <button className="rounded-lg px-2 py-1 text-xs text-faint transition-colors hover:text-brand" type="submit" title={tcount ? "Move its tasks out first" : "Delete phase"}>
                        Delete
                      </button>
                    </form>
                  </span>
                </div>
                {/* inline edit */}
                <details className="group mt-2">
                  <summary className="mono-label inline-flex cursor-pointer select-none items-center gap-1 text-[0.55rem] text-faint hover:text-brand">
                    Edit phase
                  </summary>
                  <form action={updatePhaseAction} className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    <input type="hidden" name="code" value={p.code} />
                    <input name="name" defaultValue={p.name} className={`${input} lg:col-span-2`} />
                    <input name="subtitle" defaultValue={p.subtitle} className={`${input} lg:col-span-3`} />
                    <input name="startDate" type="date" defaultValue={p.start} className={input} />
                    <input name="endDate" type="date" defaultValue={p.end} className={input} />
                    <div className="flex items-end">
                      <button className={primaryBtn} type="submit">Save phase</button>
                    </div>
                  </form>
                </details>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================ TASKS ============================ */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-ink">Tasks &amp; assignments</h2>

        {/* create */}
        <form action={createTaskAction} className="card mt-3 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={label}>Task description</label>
            <input name="description" required placeholder="e.g. Calibrate dosing pumps" className={input} />
          </div>
          <div>
            <label className={label}>Workstream</label>
            <select name="phaseCode" required className={input} defaultValue={phases[0]?.code}>
              {phases.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Department</label>
            <select name="roleCode" required className={input} defaultValue={departments[0]?.code}>
              {departments.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} · {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Owner</label>
            <select name="owner" className={input} defaultValue={team[0]?.name}>
              <option value="Unassigned">Unassigned</option>
              {team.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Start</label>
            <input name="startDate" type="date" required defaultValue={project.start} className={input} />
          </div>
          <div>
            <label className={label}>End</label>
            <input name="endDate" type="date" required defaultValue={project.end} className={input} />
          </div>
          <div>
            <label className={label}>Work days</label>
            <input name="workDays" type="number" min={0} defaultValue={1} className={input} />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button type="submit" className={primaryBtn}>
              + Create &amp; assign task
            </button>
          </div>
        </form>

        {/* list */}
        <div className="card mt-3 overflow-x-auto p-0">
          <div className="min-w-[860px] divide-y divide-black/8">
            <div className="grid grid-cols-[1.6fr_0.7fr_1fr_1.4fr_auto] gap-3 px-4 py-2.5">
              {["Task", "Phase", "Owner", "Schedule", ""].map((h, i) => (
                <span key={i} className="mono-label text-[0.52rem]">
                  {h}
                </span>
              ))}
            </div>
            {realTasks.map((t) => (
              <div key={t.id} className="grid grid-cols-[1.6fr_0.7fr_1fr_1.4fr_auto] items-center gap-3 px-4 py-2.5">
                <span className="truncate text-sm text-ink" title={t.desc}>
                  {t.desc}
                </span>
                <span className="font-mono text-[0.62rem] text-mute">{t.phaseCode}</span>
                {/* reassign + edit */}
                <form action={updateTaskAction} className="contents">
                  <input type="hidden" name="id" value={t.id} />
                  <select name="owner" defaultValue={t.owner} className="rounded-md border border-black/12 bg-black/[0.03] px-2 py-1 text-xs text-ink">
                    <option value="Unassigned">Unassigned</option>
                    {team.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <span className="flex items-center gap-1.5">
                    <input name="startDate" type="date" defaultValue={t.start} className="rounded-md border border-black/12 bg-black/[0.03] px-1.5 py-1 text-[0.7rem] text-ink" />
                    <input name="endDate" type="date" defaultValue={t.end} className="rounded-md border border-black/12 bg-black/[0.03] px-1.5 py-1 text-[0.7rem] text-ink" />
                    <input type="hidden" name="roleCode" value={t.role} />
                    <input type="hidden" name="workDays" value={t.workDays} />
                    <button className={ghostBtn} type="submit">
                      Save
                    </button>
                  </span>
                </form>
                <form action={deleteTaskAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="rounded-lg px-2 py-1 text-xs text-faint transition-colors hover:text-brand" type="submit" aria-label="Delete task">
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-faint">
          {realTasks.length} tasks · changing dates vs the baseline is flagged on each task profile.
        </p>
      </section>

      {/* ============================ TEAM ============================ */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-ink">Onboard team</h2>
        <p className="mt-1 text-xs text-mute">
          Department is the shared functional role; <b>designation</b> is the person&apos;s specific
          title within it (several people can share a department, so the designation distinguishes them).
        </p>
        <form action={createMemberAction} className="card mt-3 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <label className={label}>Name</label>
            <input name="name" required placeholder="Full name" className={input} />
          </div>
          <DesignationPicker
            departments={departments.map((d) => ({ code: d.code as RoleCode, name: d.name }))}
            inputClass={input}
            labelClass={label}
          />
          <div className="flex items-end justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-mute">
              <input name="lead" type="checkbox" className="h-4 w-4 accent-brand" /> Project lead
            </label>
            <button type="submit" className={primaryBtn}>
              + Onboard
            </button>
          </div>
        </form>

        <div className="card mt-3 divide-y divide-black/8 p-0">
          {team.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-black/8 font-mono text-[0.6rem] text-ink">
                {m.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {m.name} {m.lead && <span className="text-[0.6rem] text-brand">· LEAD</span>}
                </span>
                <span className="block text-xs text-mute">
                  {m.title} · {m.role}
                </span>
              </span>
              <form action={deleteMemberAction}>
                <input type="hidden" name="id" value={m.id} />
                <button className="text-xs text-faint hover:text-brand" type="submit">
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ ACCESS (admin) ============================ */}
      {isAdmin && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-ink">Access &amp; accounts</h2>
          <p className="mt-1 text-xs text-mute">
            Roles: <b>ADMIN</b> = Manager (full control), <b>EDITOR</b> = Engineer (works on their own
            department&apos;s tasks), <b>VIEWER</b> = Client (read-only). Department ties an engineer to a
            functional role from the Gantt.
          </p>
          <form action={createUserAction} className="card mt-3 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className={label}>Email</label>
              <input name="email" type="email" required placeholder="name@aapaavani.com" className={input} />
            </div>
            <div>
              <label className={label}>Name</label>
              <input name="name" required placeholder="Full name" className={input} />
            </div>
            <div>
              <label className={label}>Role</label>
              <select name="role" required defaultValue="VIEWER" className={input}>
                <option value="ADMIN">ADMIN · Manager</option>
                <option value="EDITOR">EDITOR · Engineer</option>
                <option value="VIEWER">VIEWER · Client</option>
              </select>
            </div>
            <div>
              <label className={label}>Department</label>
              <select name="department" defaultValue="" className={input}>
                <option value="">— none —</option>
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} · {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Temp password</label>
              <input name="password" type="text" required minLength={6} placeholder="min 6 chars" className={input} />
            </div>
            <div className="flex items-end lg:col-span-6">
              <button type="submit" className={primaryBtn}>
                + Create account
              </button>
            </div>
          </form>

          <div className="card mt-3 divide-y divide-black/8 p-0">
            {users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {u.name}
                    {u.department && (
                      <span className="ml-2 rounded bg-black/8 px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest text-mute">
                        {u.department}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-mute">
                    {u.email} · joined {fmtShort(u.createdAt)}
                  </span>
                </span>
                <form action={setUserAccessAction} className="flex items-center gap-1.5">
                  <input type="hidden" name="id" value={u.id} />
                  <select name="role" defaultValue={u.role} className="rounded-md border border-black/12 bg-black/[0.03] px-2 py-1 text-xs text-ink">
                    <option value="ADMIN">ADMIN</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                  <select name="department" defaultValue={u.department ?? ""} className="rounded-md border border-black/12 bg-black/[0.03] px-2 py-1 text-xs text-ink">
                    <option value="">— dept —</option>
                    {departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code}
                      </option>
                    ))}
                  </select>
                  <button className={ghostBtn} type="submit">
                    Update
                  </button>
                </form>
                <form action={deleteUserAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <button className="text-xs text-faint hover:text-brand" type="submit" disabled={u.id === user.uid}>
                    {u.id === user.uid ? "You" : "Remove"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================ PROJECT (admin) ============================ */}
      {isAdmin && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-ink">Project settings</h2>
          <form action={updateProjectAction} className="card mt-3 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label className={label}>Client</label>
              <input name="client" defaultValue={project.client} className={input} />
            </div>
            <div>
              <label className={label}>Priority</label>
              <input name="priority" defaultValue={project.priority} className={input} />
            </div>
            <div className="lg:col-span-2">
              <label className={label}>Builder</label>
              <input name="builder" defaultValue={project.builder} className={input} />
            </div>
            <div>
              <label className={label}>Programme</label>
              <input name="programme" defaultValue={project.programme} className={input} />
            </div>
            <div>
              <label className={label}>Project lead</label>
              <input name="lead" defaultValue={project.lead} className={input} />
            </div>
            <div>
              <label className={label}>Start</label>
              <input name="startDate" type="date" defaultValue={project.start} className={input} />
            </div>
            <div>
              <label className={label}>Target close</label>
              <input name="endDate" type="date" defaultValue={project.end} className={input} />
            </div>
            <div>
              <label className={label}>As of (today marker)</label>
              <input name="asOf" type="date" defaultValue={project.asOf} className={input} />
            </div>
            <div className="flex items-end lg:col-span-3">
              <button type="submit" className={primaryBtn}>
                Save settings
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
