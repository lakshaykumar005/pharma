import "server-only";
import { prisma } from "./db";
import { hashPassword, verifyPassword } from "./password";
import type { Role } from "./types";

/* Prisma transaction client type (loose — avoids importing generated internals). */
type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Recompute a phase's work-day-weighted % and mirror onto its milestone(s). */
async function recomputePhase(tx: Tx, phaseCode: string): Promise<number> {
  const tasks = await tx.task.findMany({ where: { phaseCode, type: "T" } });
  const totalWork = tasks.reduce((s, t) => s + t.workDays, 0);
  const done = tasks.reduce((s, t) => s + t.workDays * (t.pct / 100), 0);
  const phasePct = totalWork ? Math.round((done / totalWork) * 100) : 0;
  await tx.phase.update({ where: { code: phaseCode }, data: { pct: phasePct } });
  await tx.task.updateMany({ where: { phaseCode, type: "M" }, data: { pct: phasePct } });
  return phasePct;
}

/** Recompute a task's % from its subtasks (no-op if it has none). */
async function recomputeTaskFromSubtasks(tx: Tx, taskId: number): Promise<number | null> {
  const subs = await tx.subtask.findMany({ where: { taskId } });
  if (subs.length === 0) return null;
  const pct = Math.round((subs.filter((s) => s.done).length / subs.length) * 100);
  await tx.task.update({ where: { id: taskId }, data: { pct } });
  return pct;
}

/** Manual progress (slider). Rejected when the task is driven by subtasks. */
export async function updateTaskProgress(id: number, pct: number) {
  if (!Number.isInteger(id)) throw new Error("Invalid task id");
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new Error("pct must be 0–100");

  const task = await prisma.task.findUnique({ where: { id }, include: { subtasks: true } });
  if (!task) throw new Error("Task not found");
  if (task.type !== "T") throw new Error("Milestone progress is derived and cannot be set directly");
  if (task.subtasks.length > 0) throw new Error("Progress is driven by this task's subtasks");

  const clamped = Math.round(pct);
  return prisma.$transaction(async (tx) => {
    await tx.task.update({ where: { id }, data: { pct: clamped } });
    const phasePct = await recomputePhase(tx, task.phaseCode);
    return { id, pct: clamped, phaseCode: task.phaseCode, phasePct, desc: task.description };
  });
}

export async function addSubtask(taskId: number, title: string) {
  const clean = title.trim();
  if (!Number.isInteger(taskId)) throw new Error("Invalid task id");
  if (!clean) throw new Error("Subtask title is required");
  if (clean.length > 160) throw new Error("Subtask title too long");

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");
  if (task.type !== "T") throw new Error("Milestones cannot have subtasks");

  return prisma.$transaction(async (tx) => {
    const max = await tx.subtask.aggregate({ where: { taskId }, _max: { order: true } });
    const created = await tx.subtask.create({
      data: { taskId, title: clean, order: (max._max.order ?? -1) + 1 },
    });
    await recomputeTaskFromSubtasks(tx, taskId);
    const phasePct = await recomputePhase(tx, task.phaseCode);
    return { subtask: created, phaseCode: task.phaseCode, phasePct };
  });
}

export async function setSubtaskDone(id: number, done: boolean) {
  if (!Number.isInteger(id)) throw new Error("Invalid subtask id");
  const sub = await prisma.subtask.findUnique({ where: { id }, include: { task: true } });
  if (!sub) throw new Error("Subtask not found");

  return prisma.$transaction(async (tx) => {
    await tx.subtask.update({ where: { id }, data: { done: Boolean(done) } });
    const taskPct = await recomputeTaskFromSubtasks(tx, sub.taskId);
    const phasePct = await recomputePhase(tx, sub.task.phaseCode);
    return { id, done: Boolean(done), taskId: sub.taskId, taskPct, phasePct, title: sub.title };
  });
}

export async function deleteSubtask(id: number) {
  if (!Number.isInteger(id)) throw new Error("Invalid subtask id");
  const sub = await prisma.subtask.findUnique({ where: { id }, include: { task: true } });
  if (!sub) throw new Error("Subtask not found");

  return prisma.$transaction(async (tx) => {
    await tx.subtask.delete({ where: { id } });
    const taskPct = await recomputeTaskFromSubtasks(tx, sub.taskId);
    const phasePct = await recomputePhase(tx, sub.task.phaseCode);
    return { id, taskId: sub.taskId, taskPct, phasePct };
  });
}

/** Set a task's working state (ACTIVE / BLOCKED / ON_HOLD). */
export async function setTaskState(id: number, state: string) {
  const valid = ["ACTIVE", "BLOCKED", "ON_HOLD"];
  if (!valid.includes(state)) throw new Error("Invalid state");
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found");
  await prisma.task.update({ where: { id }, data: { state } });
  return { id, state, desc: task.description };
}

/** Add a comment / note to a task. */
export async function addComment(taskId: number, author: string, role: string, body: string) {
  const clean = body.trim();
  if (!Number.isInteger(taskId)) throw new Error("Invalid task id");
  if (!clean) throw new Error("Comment can't be empty");
  if (clean.length > 1000) throw new Error("Comment too long");
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");
  const c = await prisma.comment.create({ data: { taskId, author, role, body: clean } });
  return { id: c.id, createdAt: c.createdAt.toISOString(), taskDesc: task.description };
}

/* ============================================================================
   ADMIN / MANAGEMENT MUTATIONS — tasks, team, users, project
   ============================================================================ */

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export interface NewTaskInput {
  description: string;
  phaseCode: string;
  roleCode: string;
  owner: string;
  startDate: string;
  endDate: string;
  workDays: number;
  predecessorId?: number | null;
}

/** Create + assign a new task in a phase. */
export async function createTask(input: NewTaskInput) {
  const description = input.description.trim();
  if (!description) throw new Error("Task description is required");
  if (!ISO.test(input.startDate) || !ISO.test(input.endDate)) throw new Error("Dates must be yyyy-mm-dd");
  if (input.endDate < input.startDate) throw new Error("End date must be on/after start date");
  if (!Number.isFinite(input.workDays) || input.workDays < 0) throw new Error("Work days must be ≥ 0");

  const phase = await prisma.phase.findUnique({ where: { code: input.phaseCode } });
  if (!phase) throw new Error("Phase not found");
  const dept = await prisma.department.findUnique({ where: { code: input.roleCode } });
  if (!dept) throw new Error("Department/role not found");

  return prisma.$transaction(async (tx) => {
    const maxId = (await tx.task.aggregate({ _max: { id: true } }))._max.id ?? 100;
    const maxOrder = (await tx.task.aggregate({ _max: { order: true } }))._max.order ?? 0;
    const id = maxId + 1;
    await tx.task.create({
      data: {
        id,
        type: "T",
        description,
        owner: input.owner.trim() || "Unassigned",
        startDate: input.startDate,
        endDate: input.endDate,
        baselineStart: input.startDate,
        baselineEnd: input.endDate,
        workDays: Math.round(input.workDays),
        pct: 0,
        depType: "FS",
        critical: false,
        order: maxOrder + 1,
        roleCode: input.roleCode,
        phaseCode: input.phaseCode,
      },
    });
    if (input.predecessorId) {
      const pred = await tx.task.findUnique({ where: { id: input.predecessorId } });
      if (pred) await tx.dependency.create({ data: { taskId: id, dependsOnId: input.predecessorId } });
    }
    await recomputePhase(tx, input.phaseCode);
    return { id };
  });
}

export interface EditTaskInput {
  description?: string;
  owner?: string;
  roleCode?: string;
  startDate?: string;
  endDate?: string;
  workDays?: number;
}

/** Edit a task's details (reassign owner, change dates/dept/work-days). */
export async function updateTask(id: number, input: EditTaskInput) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found");

  const data: Record<string, unknown> = {};
  if (input.description !== undefined && input.description.trim()) data.description = input.description.trim();
  if (input.owner !== undefined) data.owner = input.owner.trim() || "Unassigned";
  if (input.roleCode !== undefined) {
    const dept = await prisma.department.findUnique({ where: { code: input.roleCode } });
    if (!dept) throw new Error("Department/role not found");
    data.roleCode = input.roleCode;
  }
  if (input.startDate !== undefined) {
    if (!ISO.test(input.startDate)) throw new Error("Start date must be yyyy-mm-dd");
    data.startDate = input.startDate;
  }
  if (input.endDate !== undefined) {
    if (!ISO.test(input.endDate)) throw new Error("End date must be yyyy-mm-dd");
    data.endDate = input.endDate;
  }
  if (input.workDays !== undefined) {
    if (!Number.isFinite(input.workDays) || input.workDays < 0) throw new Error("Work days must be ≥ 0");
    data.workDays = Math.round(input.workDays);
  }

  return prisma.$transaction(async (tx) => {
    await tx.task.update({ where: { id }, data });
    const phasePct = await recomputePhase(tx, task.phaseCode);
    return { id, phasePct, desc: task.description };
  });
}

/** Delete a task (and its subtasks + dependency edges), then recompute phase. */
export async function deleteTask(id: number) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found");
  if (task.type === "M") throw new Error("Milestones can't be deleted directly");

  return prisma.$transaction(async (tx) => {
    await tx.dependency.deleteMany({ where: { OR: [{ taskId: id }, { dependsOnId: id }] } });
    await tx.subtask.deleteMany({ where: { taskId: id } });
    await tx.task.delete({ where: { id } });
    const phasePct = await recomputePhase(tx, task.phaseCode);
    return { id, phaseCode: task.phaseCode, phasePct, desc: task.description };
  });
}

/* ----------------------------- team members ------------------------------ */

export async function createMember(input: { name: string; title: string; roleCode: string; lead: boolean }) {
  const name = input.name.trim();
  const title = input.title.trim();
  if (!name) throw new Error("Name is required");
  if (!title) throw new Error("Title is required");
  const dept = await prisma.department.findUnique({ where: { code: input.roleCode } });
  if (!dept) throw new Error("Department/role not found");
  const maxOrder = (await prisma.member.aggregate({ _max: { order: true } }))._max.order ?? 0;
  return prisma.member.create({
    data: { name, title, roleCode: input.roleCode, lead: Boolean(input.lead), order: maxOrder + 1 },
  });
}

export async function deleteMember(id: number) {
  if (!Number.isInteger(id)) throw new Error("Invalid member id");
  await prisma.member.delete({ where: { id } });
  return { id };
}

/* ------------------------------- users ----------------------------------- */

const ROLES: Role[] = ["ADMIN", "EDITOR", "VIEWER"];

export async function createUser(input: { email: string; name: string; role: Role; password: string }) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email");
  if (!name) throw new Error("Name is required");
  if (!ROLES.includes(input.role)) throw new Error("Invalid role");
  if (input.password.length < 6) throw new Error("Password must be at least 6 characters");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with that email already exists");

  const user = await prisma.user.create({
    data: { email, name, role: input.role, passwordHash: hashPassword(input.password) },
  });
  return { id: user.id, email: user.email };
}

export async function setUserRole(id: number, role: Role) {
  if (!ROLES.includes(role)) throw new Error("Invalid role");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");
  // Don't allow removing the last admin.
  if (user.role === "ADMIN" && role !== "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) throw new Error("Can't demote the last admin");
  }
  await prisma.user.update({ where: { id }, data: { role } });
  return { id, role };
}

export async function deleteUser(id: number, currentUserId: number) {
  if (id === currentUserId) throw new Error("You can't delete your own account");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");
  if (user.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) throw new Error("Can't delete the last admin");
  }
  await prisma.user.delete({ where: { id } });
  return { id };
}

/** Self-service password change — verifies the current password first. */
export async function changePassword(userId: number, oldPw: string, newPw: string) {
  if (newPw.length < 6) throw new Error("New password must be at least 6 characters");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (!verifyPassword(oldPw, user.passwordHash)) throw new Error("Current password is incorrect");
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashPassword(newPw) } });
  return { ok: true };
}

/* ------------------------------ project ---------------------------------- */

export async function updateProjectSettings(input: {
  client: string;
  builder: string;
  programme: string;
  lead: string;
  priority: string;
  startDate: string;
  endDate: string;
  asOf: string;
}) {
  for (const k of ["startDate", "endDate", "asOf"] as const) {
    if (!ISO.test(input[k])) throw new Error(`${k} must be yyyy-mm-dd`);
  }
  const existing = await prisma.project.findFirst();
  if (!existing) throw new Error("Project not found");
  await prisma.project.update({
    where: { id: existing.id },
    data: {
      client: input.client.trim(),
      builder: input.builder.trim(),
      programme: input.programme.trim(),
      lead: input.lead.trim(),
      priority: input.priority.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      asOf: input.asOf,
    },
  });
  return { ok: true };
}
