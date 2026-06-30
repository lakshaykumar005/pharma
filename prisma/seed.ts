import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../app/lib/password";

// Seed over the DIRECT connection (avoids pgbouncer prepared-statement issues).
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DIRECT_URL (or DATABASE_URL) in .env");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/* ---------------------------------------------------------------------------
   Source of truth: "Gantt_Chart Anthem Biosciences Limited.xlsm" +
   "Current project status.pdf" (snapshot 25-Jun-2026). All real Gantt values.
   --------------------------------------------------------------------------- */

const PROJECT = {
  id: "anthem",
  client: "Anthem Biosciences Limited",
  builder: "Aapaavani Environmental Solutions",
  tagline: "Solutions for a better tomorrow",
  programme: "ETP Demonstration",
  blurb: "Three engineering lines, one commissioned system.",
  startDate: "2026-06-17",
  endDate: "2026-08-03",
  asOf: "2026-06-25",
  priority: "High",
  lead: "Keerthan Gowda",
  workWeek: "7 days / week · no holidays",
  axisStart: "2026-06-16",
  axisEnd: "2026-08-04",
};

const DEPARTMENTS = [
  { code: "DES", name: "Design", description: "Engineering drawings, specifications & procurement planning", order: 1 },
  { code: "PRO", name: "Project", description: "Site execution, installation & commissioning", order: 2 },
  { code: "A&P", name: "Accounts & Purchase", description: "Purchase orders, vendor coordination & logistics", order: 3 },
  { code: "SER", name: "Service", description: "Operational commissioning & service delivery", order: 4 },
  { code: "SIM", name: "Simulation", description: "Process simulation & performance validation", order: 5 },
];

const TEAM = [
  { name: "Keerthan Gowda", roleCode: "PRO", title: "Project Lead", lead: true, order: 1 },
  { name: "Rahul Karkera", roleCode: "DES", title: "Design Engineer", lead: false, order: 2 },
  { name: "Krishnaraj", roleCode: "PRO", title: "Project Engineer", lead: false, order: 3 },
  { name: "Sampath", roleCode: "A&P", title: "Accounts & Purchase", lead: false, order: 4 },
  { name: "Bhushan", roleCode: "SER", title: "Service Engineer", lead: false, order: 5 },
  { name: "Eshanthraj", roleCode: "SIM", title: "Simulation Engineer", lead: false, order: 6 },
];

// Subtasks keyed by task id. Completion ratio matches each task's % so the
// rollup stays consistent (task 2 = 100% → all done; tasks 7/8/13 = 0% → none).
const SUBTASKS: Record<number, { title: string; done: boolean }[]> = {
  2: [
    { title: "Identify demo-plant vendors", done: true },
    { title: "Confirm technical specifications", done: true },
    { title: "Collect & compare quotations", done: true },
  ],
  7: [
    { title: "Prepare foundation & utilities", done: false },
    { title: "Position demo-plant skid", done: false },
    { title: "Connect piping & power", done: false },
    { title: "Pre-commissioning checks", done: false },
  ],
  8: [
    { title: "Baseline influent sampling", done: false },
    { title: "Trial run — week 1", done: false },
    { title: "Trial run — week 2", done: false },
    { title: "Performance validation", done: false },
    { title: "Compile trial report", done: false },
  ],
  13: [
    { title: "Receive SCADA license", done: false },
    { title: "Install on site server", done: false },
    { title: "Configure I/O tags", done: false },
  ],
};

const USERS = [
  { email: "admin@aapaavani.com", name: "Keerthan Gowda", role: "ADMIN", department: "PRO", password: "anthem123" },
  { email: "editor@aapaavani.com", name: "Rahul Karkera", role: "EDITOR", department: "DES", password: "editor123" },
  { email: "viewer@aapaavani.com", name: "Site Viewer", role: "VIEWER", department: null, password: "viewer123" },
];

const PHASES = [
  { code: "PH-01", name: "Demo-Plant & Sensors", subtitle: "Demo-Trial Commissioned", startDate: "2026-06-17", endDate: "2026-08-03", pct: 24, order: 1 },
  { code: "PH-02", name: "SCADA Automation", subtitle: "SCADA Commissioned Live", startDate: "2026-06-17", endDate: "2026-07-27", pct: 33, order: 2 },
  { code: "PH-03", name: "Membrane Skid", subtitle: "Membrane Service Live", startDate: "2026-06-17", endDate: "2026-07-31", pct: 25, order: 3 },
];

type SeedTask = {
  id: number;
  type: "T" | "M";
  description: string;
  roleCode: string;
  owner: string;
  start: string;
  end: string;
  workDays: number;
  pct: number;
  deps: number[];
  depType: "FS" | "FF";
  phaseCode: string;
  critical?: boolean;
};

const TASKS: SeedTask[] = [
  // PH-01
  { id: 2, type: "T", description: "Procurement planning for demo-plant", roleCode: "DES", owner: "Rahul Karkera", start: "2026-06-17", end: "2026-06-19", workDays: 3, pct: 100, deps: [], depType: "FS", phaseCode: "PH-01" },
  { id: 3, type: "T", description: "Procurement planning for sensors", roleCode: "PRO", owner: "Krishnaraj", start: "2026-06-17", end: "2026-06-19", workDays: 3, pct: 100, deps: [], depType: "FS", phaseCode: "PH-01" },
  { id: 4, type: "T", description: "Purchase order for demo-plant & sensors", roleCode: "A&P", owner: "Sampath", start: "2026-06-20", end: "2026-06-20", workDays: 1, pct: 100, deps: [2, 3], depType: "FS", phaseCode: "PH-01" },
  { id: 5, type: "T", description: "Supply & delivery of demo-plant to project site", roleCode: "DES", owner: "Rahul Karkera", start: "2026-07-06", end: "2026-07-10", workDays: 5, pct: 30, deps: [4], depType: "FS", phaseCode: "PH-01", critical: true },
  { id: 6, type: "T", description: "Supply & delivery of sensors to project site", roleCode: "PRO", owner: "Krishnaraj", start: "2026-07-06", end: "2026-07-10", workDays: 5, pct: 30, deps: [5], depType: "FS", phaseCode: "PH-01", critical: true },
  { id: 7, type: "T", description: "Demo-plant installation", roleCode: "PRO", owner: "Keerthan Gowda", start: "2026-07-10", end: "2026-07-14", workDays: 5, pct: 0, deps: [6], depType: "FS", phaseCode: "PH-01", critical: true },
  { id: 8, type: "T", description: "Commencement of demo-trial", roleCode: "PRO", owner: "Keerthan Gowda", start: "2026-07-15", end: "2026-08-03", workDays: 20, pct: 0, deps: [7], depType: "FS", phaseCode: "PH-01", critical: true },
  { id: 9, type: "M", description: "Milestone-1 · Demo-Trial Commissioned", roleCode: "PRO", owner: "Keerthan Gowda", start: "2026-08-03", end: "2026-08-03", workDays: 0, pct: 24, deps: [8], depType: "FF", phaseCode: "PH-01", critical: true },
  // PH-02
  { id: 11, type: "T", description: "Procurement planning for SCADA software", roleCode: "DES", owner: "Rahul Karkera", start: "2026-06-17", end: "2026-06-19", workDays: 3, pct: 100, deps: [], depType: "FS", phaseCode: "PH-02" },
  { id: 12, type: "T", description: "Purchase order for SCADA", roleCode: "A&P", owner: "Sampath", start: "2026-06-20", end: "2026-06-20", workDays: 1, pct: 100, deps: [11], depType: "FS", phaseCode: "PH-02" },
  { id: 13, type: "T", description: "Supply & delivery of SCADA software", roleCode: "DES", owner: "Rahul Karkera", start: "2026-07-20", end: "2026-07-22", workDays: 3, pct: 0, deps: [12], depType: "FS", phaseCode: "PH-02" },
  { id: 14, type: "T", description: "Commencement of SCADA", roleCode: "PRO", owner: "Keerthan Gowda", start: "2026-07-23", end: "2026-07-27", workDays: 5, pct: 0, deps: [13], depType: "FS", phaseCode: "PH-02" },
  { id: 15, type: "M", description: "Milestone-2 · SCADA Commissioned Live", roleCode: "PRO", owner: "Keerthan Gowda", start: "2026-07-27", end: "2026-07-27", workDays: 0, pct: 33, deps: [14], depType: "FF", phaseCode: "PH-02" },
  // PH-03
  { id: 17, type: "T", description: "Procurement planning for Membrane skid", roleCode: "DES", owner: "Rahul Karkera", start: "2026-06-17", end: "2026-06-19", workDays: 3, pct: 100, deps: [], depType: "FS", phaseCode: "PH-03" },
  { id: 18, type: "T", description: "Purchase order for membrane skid", roleCode: "A&P", owner: "Sampath", start: "2026-06-20", end: "2026-06-20", workDays: 1, pct: 100, deps: [17], depType: "FS", phaseCode: "PH-03" },
  { id: 19, type: "T", description: "Supply & delivery of Membrane skid", roleCode: "DES", owner: "Rahul Karkera", start: "2026-07-20", end: "2026-07-26", workDays: 7, pct: 0, deps: [18], depType: "FS", phaseCode: "PH-03" },
  { id: 20, type: "T", description: "Commencement of Membrane service", roleCode: "SER", owner: "Bhushan", start: "2026-07-27", end: "2026-07-31", workDays: 5, pct: 0, deps: [19], depType: "FS", phaseCode: "PH-03" },
  { id: 21, type: "M", description: "Milestone-3 · Membrane Service Live", roleCode: "SER", owner: "Bhushan", start: "2026-07-31", end: "2026-07-31", workDays: 0, pct: 25, deps: [20], depType: "FF", phaseCode: "PH-03" },
];

async function main() {
  console.log("→ Seeding Anthem Biosciences Command Center…");

  // clean slate (order matters for FKs)
  await prisma.subtask.deleteMany();
  await prisma.dependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.member.deleteMany();
  await prisma.department.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  await prisma.project.create({ data: PROJECT });

  for (const u of USERS) {
    await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        role: u.role,
        department: u.department,
        passwordHash: hashPassword(u.password),
      },
    });
  }

  for (const dpt of DEPARTMENTS) await prisma.department.create({ data: dpt });
  for (const m of TEAM) await prisma.member.create({ data: m });
  for (const p of PHASES) await prisma.phase.create({ data: p });

  let order = 0;
  for (const t of TASKS) {
    await prisma.task.create({
      data: {
        id: t.id,
        type: t.type,
        description: t.description,
        owner: t.owner,
        startDate: t.start,
        endDate: t.end,
        baselineStart: t.start, // on baseline: actual plan == base plan
        baselineEnd: t.end,
        workDays: t.workDays,
        pct: t.pct,
        depType: t.depType,
        critical: t.critical ?? false,
        order: order++,
        roleCode: t.roleCode,
        phaseCode: t.phaseCode,
      },
    });
  }

  // dependency edges (predecessors)
  for (const t of TASKS) {
    for (const dep of t.deps) {
      await prisma.dependency.create({ data: { taskId: t.id, dependsOnId: dep } });
    }
  }

  // subtasks
  for (const [taskId, subs] of Object.entries(SUBTASKS)) {
    let o = 0;
    for (const s of subs) {
      await prisma.subtask.create({
        data: { taskId: Number(taskId), title: s.title, done: s.done, order: o++ },
      });
    }
  }

  const counts = {
    users: await prisma.user.count(),
    departments: await prisma.department.count(),
    members: await prisma.member.count(),
    phases: await prisma.phase.count(),
    tasks: await prisma.task.count(),
    dependencies: await prisma.dependency.count(),
    subtasks: await prisma.subtask.count(),
  };
  console.log("✓ Seed complete:", counts);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
