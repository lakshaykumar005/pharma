"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, canManage } from "./auth";
import {
  createTask,
  updateTask,
  deleteTask,
  createMember,
  deleteMember,
  createUser,
  setUserAccess,
  deleteUser,
  updateProjectSettings,
  createPhase,
  updatePhase,
  deletePhase,
  reorderPhase,
} from "./mutations";
import { logActivity } from "./activity";
import { notifyAssignment } from "./email";
import type { Role } from "./types";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const n = (fd: FormData, k: string) => Number(fd.get(k) ?? 0);

function refresh() {
  revalidatePath("/manage");
  revalidatePath("/dashboard");
}

function refreshPhases() {
  revalidatePath("/manage");
  revalidatePath("/dashboard");
  revalidatePath("/report");
}

function back(ok: string) {
  redirect(`/manage?ok=${encodeURIComponent(ok)}`);
}
function fail(msg: string): never {
  redirect(`/manage?error=${encodeURIComponent(msg)}`);
}

// All /manage operations are manager-only (ADMIN). Engineers (EDITOR) execute
// task work — progress, subtasks, comments — but don't manage the programme.
async function ensureManager() {
  const u = await getCurrentUser();
  if (!u || !canManage(u.role)) fail("Manager access required");
  return u!;
}

/* ------------------------------- tasks ----------------------------------- */

export async function createTaskAction(fd: FormData) {
  const u = await ensureManager();
  const desc = s(fd, "description");
  const owner = s(fd, "owner");
  try {
    await createTask({
      description: desc,
      phaseCode: s(fd, "phaseCode"),
      roleCode: s(fd, "roleCode"),
      owner,
      startDate: s(fd, "startDate"),
      endDate: s(fd, "endDate"),
      workDays: n(fd, "workDays"),
      predecessorId: fd.get("predecessorId") ? n(fd, "predecessorId") : null,
    });
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not create task");
  }
  await logActivity({ actor: u.name, verb: "created & assigned", target: desc, detail: owner ? `to ${owner}` : undefined });
  await notifyAssignment(owner, desc);
  refresh();
  back("Task created & assigned");
}

export async function updateTaskAction(fd: FormData) {
  const u = await ensureManager();
  const id = n(fd, "id");
  const owner = s(fd, "owner");
  try {
    const r = await updateTask(id, {
      owner,
      roleCode: s(fd, "roleCode"),
      startDate: s(fd, "startDate"),
      endDate: s(fd, "endDate"),
      workDays: n(fd, "workDays"),
    });
    await logActivity({ actor: u.name, verb: "reassigned", target: r.desc, detail: `to ${owner}`, taskId: id });
    await notifyAssignment(owner, r.desc);
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not update task");
  }
  refresh();
  back("Task updated");
}

export async function deleteTaskAction(fd: FormData) {
  const u = await ensureManager();
  try {
    const r = await deleteTask(n(fd, "id"));
    await logActivity({ actor: u.name, verb: "removed task", target: r.desc });
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not delete task");
  }
  refresh();
  back("Task deleted");
}

/* ------------------------------- team ------------------------------------ */

export async function createMemberAction(fd: FormData) {
  const u = await ensureManager();
  const name = s(fd, "name");
  try {
    await createMember({
      name,
      title: s(fd, "title"),
      roleCode: s(fd, "roleCode"),
      lead: fd.get("lead") === "on",
    });
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not add member");
  }
  await logActivity({ actor: u.name, verb: "onboarded", target: name });
  refresh();
  back("Team member onboarded");
}

export async function deleteMemberAction(fd: FormData) {
  await ensureManager();
  try {
    await deleteMember(n(fd, "id"));
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not remove member");
  }
  refresh();
  back("Team member removed");
}

/* ------------------------------- users ----------------------------------- */

export async function createUserAction(fd: FormData) {
  const u = await ensureManager();
  const name = s(fd, "name");
  const role = s(fd, "role");
  try {
    await createUser({
      email: s(fd, "email"),
      name,
      role: role as Role,
      department: s(fd, "department") || null,
      password: String(fd.get("password") ?? ""),
    });
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not create user");
  }
  await logActivity({ actor: u.name, verb: "added user", target: name, detail: `as ${role}` });
  refresh();
  back("User account created");
}

export async function setUserAccessAction(fd: FormData) {
  await ensureManager();
  try {
    await setUserAccess(n(fd, "id"), s(fd, "role") as Role, s(fd, "department") || null);
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not update access");
  }
  refresh();
  back("Access updated");
}

export async function deleteUserAction(fd: FormData) {
  const me = await ensureManager();
  try {
    await deleteUser(n(fd, "id"), me.uid);
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not delete user");
  }
  refresh();
  back("User removed");
}

/* ------------------------------ project ---------------------------------- */

export async function updateProjectAction(fd: FormData) {
  await ensureManager();
  try {
    await updateProjectSettings({
      client: s(fd, "client"),
      builder: s(fd, "builder"),
      programme: s(fd, "programme"),
      lead: s(fd, "lead"),
      priority: s(fd, "priority"),
      startDate: s(fd, "startDate"),
      endDate: s(fd, "endDate"),
      asOf: s(fd, "asOf"),
    });
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not save settings");
  }
  refresh();
  back("Project settings saved");
}

/* ------------------------------- phases ---------------------------------- */

export async function createPhaseAction(fd: FormData) {
  const u = await ensureManager();
  const name = s(fd, "name");
  try {
    await createPhase({
      code: s(fd, "code"),
      name,
      subtitle: s(fd, "subtitle"),
      startDate: s(fd, "startDate"),
      endDate: s(fd, "endDate"),
    });
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not create phase");
  }
  await logActivity({ actor: u.name, verb: "added phase", target: name });
  refreshPhases();
  back("Phase created");
}

export async function updatePhaseAction(fd: FormData) {
  const u = await ensureManager();
  const code = s(fd, "code");
  try {
    const r = await updatePhase(code, {
      name: s(fd, "name"),
      subtitle: s(fd, "subtitle"),
      startDate: s(fd, "startDate"),
      endDate: s(fd, "endDate"),
    });
    await logActivity({ actor: u.name, verb: "updated phase", target: r.name });
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not update phase");
  }
  refreshPhases();
  back("Phase updated");
}

export async function deletePhaseAction(fd: FormData) {
  const u = await ensureManager();
  try {
    const r = await deletePhase(s(fd, "code"));
    await logActivity({ actor: u.name, verb: "removed phase", target: r.name });
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not delete phase");
  }
  refreshPhases();
  back("Phase deleted");
}

export async function movePhaseAction(fd: FormData) {
  await ensureManager();
  try {
    await reorderPhase(s(fd, "code"), s(fd, "dir") === "up" ? "up" : "down");
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not reorder phase");
  }
  refreshPhases();
  back("Phase order updated");
}
