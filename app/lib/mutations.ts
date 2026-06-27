import "server-only";
import { prisma } from "./db";

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
    return { id, pct: clamped, phaseCode: task.phaseCode, phasePct };
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
    return { id, done: Boolean(done), taskId: sub.taskId, taskPct, phasePct };
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
