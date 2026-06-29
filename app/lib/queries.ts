import "server-only";
import { prisma } from "./db";
import type {
  ProjectMeta,
  Department,
  Member,
  Phase,
  Task,
  TaskDetail,
  Snapshot,
  RoleCode,
  ItemType,
  DepType,
} from "./types";

/* ----------------------------- row mappers ------------------------------ */

type TaskRow = {
  id: number;
  type: string;
  description: string;
  roleCode: string;
  owner: string;
  startDate: string;
  endDate: string;
  baselineStart: string;
  baselineEnd: string;
  workDays: number;
  pct: number;
  depType: string;
  phaseCode: string;
  critical: boolean;
  predecessors?: { dependsOnId: number }[];
  subtasks?: { id: number; title: string; done: boolean; order: number }[];
};

function mapTask(t: TaskRow): Task {
  return {
    id: t.id,
    type: t.type as ItemType,
    desc: t.description,
    role: t.roleCode as RoleCode,
    owner: t.owner,
    start: t.startDate,
    end: t.endDate,
    baselineStart: t.baselineStart,
    baselineEnd: t.baselineEnd,
    workDays: t.workDays,
    pct: t.pct,
    deps: (t.predecessors ?? []).map((d) => d.dependsOnId).sort((a, b) => a - b),
    depType: t.depType as DepType,
    phaseCode: t.phaseCode,
    critical: t.critical,
    subtasks: (t.subtasks ?? []).map((s) => ({ id: s.id, title: s.title, done: s.done, order: s.order })),
  };
}

const taskInclude = {
  predecessors: { select: { dependsOnId: true } },
  subtasks: { orderBy: { order: "asc" as const } },
};

/* ------------------------------- queries -------------------------------- */

export async function getProject(): Promise<ProjectMeta> {
  const p = await prisma.project.findFirstOrThrow();
  return {
    client: p.client,
    builder: p.builder,
    tagline: p.tagline,
    programme: p.programme,
    blurb: p.blurb,
    start: p.startDate,
    end: p.endDate,
    asOf: p.asOf,
    priority: p.priority,
    lead: p.lead,
    workWeek: p.workWeek,
    axisStart: p.axisStart,
    axisEnd: p.axisEnd,
  };
}

export async function getDepartments(): Promise<Department[]> {
  const rows = await prisma.department.findMany({ orderBy: { order: "asc" } });
  return rows.map((d) => ({ code: d.code as RoleCode, name: d.name, desc: d.description }));
}

export async function getTeam(): Promise<Member[]> {
  const rows = await prisma.member.findMany({ orderBy: { order: "asc" } });
  return rows.map((m) => ({
    name: m.name,
    role: m.roleCode as RoleCode,
    title: m.title,
    lead: m.lead,
  }));
}

export async function getPhases(): Promise<Phase[]> {
  const rows = await prisma.phase.findMany({
    orderBy: { order: "asc" },
    include: {
      tasks: {
        orderBy: { order: "asc" },
        include: taskInclude,
      },
    },
  });
  return rows.map((p) => ({
    code: p.code,
    name: p.name,
    subtitle: p.subtitle,
    start: p.startDate,
    end: p.endDate,
    pct: p.pct,
    tasks: p.tasks.map(mapTask),
  }));
}

export async function getAllTasks(): Promise<Task[]> {
  const rows = await prisma.task.findMany({
    orderBy: { order: "asc" },
    include: taskInclude,
  });
  return rows.map(mapTask);
}

export async function getSnapshot(): Promise<Snapshot> {
  const [project, phases, departments, team] = await Promise.all([
    getProject(),
    getPhases(),
    getDepartments(),
    getTeam(),
  ]);
  return { project, phases, departments, team };
}

export async function getTaskDetail(id: number): Promise<TaskDetail | null> {
  if (!Number.isFinite(id)) return null;

  const row = await prisma.task.findUnique({
    where: { id },
    include: {
      ...taskInclude,
      dependents: { select: { taskId: true } },
      phase: true,
    },
  });
  if (!row) return null;

  const task = mapTask(row);
  const dept = (await getDepartments()).find((d) => d.code === task.role)!;

  const predIds = row.predecessors.map((d) => d.dependsOnId);
  const succIds = row.dependents.map((d) => d.taskId);

  const all = await getAllTasks();
  const byId = new Map(all.map((t) => [t.id, t]));
  const predecessors = predIds.map((i) => byId.get(i)).filter((t): t is Task => !!t);
  const successors = succIds.map((i) => byId.get(i)).filter((t): t is Task => !!t);

  const phaseTasks = all.filter((t) => t.phaseCode === task.phaseCode);
  const idx = all.findIndex((t) => t.id === id);

  const phase: Phase = {
    code: row.phase.code,
    name: row.phase.name,
    subtitle: row.phase.subtitle,
    start: row.phase.startDate,
    end: row.phase.endDate,
    pct: row.phase.pct,
    tasks: phaseTasks,
  };

  return {
    task,
    phase,
    dept,
    predecessors,
    successors,
    prev: all[idx - 1] ?? null,
    next: all[idx + 1] ?? null,
  };
}

export async function getAllTaskIds(): Promise<number[]> {
  const rows = await prisma.task.findMany({ select: { id: true }, orderBy: { order: "asc" } });
  return rows.map((r) => r.id);
}

export interface MemberRow {
  id: number;
  name: string;
  title: string;
  role: RoleCode;
  lead: boolean;
}

export async function getTeamWithIds(): Promise<MemberRow[]> {
  const rows = await prisma.member.findMany({ orderBy: { order: "asc" } });
  return rows.map((m) => ({
    id: m.id,
    name: m.name,
    title: m.title,
    role: m.roleCode as RoleCode,
    lead: m.lead,
  }));
}

export interface UserRow {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export async function getUsers(): Promise<UserRow[]> {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString().slice(0, 10),
  }));
}
