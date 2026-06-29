/* UI-facing types. The DB (Prisma) rows are mapped into these in queries.ts so
   components stay decoupled from the storage schema. */

export type RoleCode = "DES" | "PRO" | "A&P" | "SER" | "SIM";
export type ItemType = "T" | "M";
export type DepType = "FS" | "FF";
export type TaskState = "ACTIVE" | "BLOCKED" | "ON_HOLD";

/** Auth roles. ADMIN/EDITOR can write; VIEWER is read-only. */
export type Role = "ADMIN" | "EDITOR" | "VIEWER";

export interface SessionUser {
  uid: number;
  email: string;
  name: string;
  role: Role;
}

export interface ProjectMeta {
  client: string;
  builder: string;
  tagline: string;
  programme: string;
  blurb: string;
  start: string;
  end: string;
  asOf: string;
  priority: string;
  lead: string;
  workWeek: string;
  axisStart: string;
  axisEnd: string;
}

export interface Department {
  code: RoleCode;
  name: string;
  desc: string;
}

export interface Member {
  name: string;
  role: RoleCode;
  title: string;
  lead: boolean;
}

export interface Subtask {
  id: number;
  title: string;
  done: boolean;
  order: number;
}

export interface Task {
  id: number;
  type: ItemType;
  desc: string;
  role: RoleCode;
  owner: string;
  start: string;
  end: string;
  baselineStart: string;
  baselineEnd: string;
  workDays: number;
  pct: number;
  state: TaskState;
  deps: number[];
  depType: DepType;
  phaseCode: string;
  critical: boolean;
  subtasks: Subtask[];
}

export interface Phase {
  code: string;
  name: string;
  subtitle: string;
  start: string;
  end: string;
  pct: number;
  tasks: Task[];
}

export interface TaskComment {
  id: number;
  author: string;
  role: string;
  body: string;
  createdAt: string;
}

export interface TaskDetail {
  task: Task;
  phase: Phase;
  dept: Department;
  predecessors: Task[];
  successors: Task[];
  prev: Task | null;
  next: Task | null;
  comments: TaskComment[];
}

export interface Snapshot {
  project: ProjectMeta;
  phases: Phase[];
  departments: Department[];
  team: Member[];
}
