"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, canEdit } from "./auth";
import {
  createTask,
  updateTask,
  deleteTask,
  createMember,
  deleteMember,
  createUser,
  setUserRole,
  deleteUser,
  updateProjectSettings,
} from "./mutations";
import type { Role } from "./types";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const n = (fd: FormData, k: string) => Number(fd.get(k) ?? 0);

function refresh() {
  revalidatePath("/manage");
  revalidatePath("/dashboard");
}

function back(ok: string) {
  redirect(`/manage?ok=${encodeURIComponent(ok)}`);
}
function fail(msg: string): never {
  redirect(`/manage?error=${encodeURIComponent(msg)}`);
}

async function ensureEditor() {
  const u = await getCurrentUser();
  if (!u || !canEdit(u.role)) fail("Editor access required");
  return u!;
}
async function ensureAdmin() {
  const u = await getCurrentUser();
  if (!u || u.role !== "ADMIN") fail("Admin access required");
  return u!;
}

/* ------------------------------- tasks ----------------------------------- */

export async function createTaskAction(fd: FormData) {
  await ensureEditor();
  try {
    await createTask({
      description: s(fd, "description"),
      phaseCode: s(fd, "phaseCode"),
      roleCode: s(fd, "roleCode"),
      owner: s(fd, "owner"),
      startDate: s(fd, "startDate"),
      endDate: s(fd, "endDate"),
      workDays: n(fd, "workDays"),
      predecessorId: fd.get("predecessorId") ? n(fd, "predecessorId") : null,
    });
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not create task");
  }
  refresh();
  back("Task created & assigned");
}

export async function updateTaskAction(fd: FormData) {
  await ensureEditor();
  const id = n(fd, "id");
  try {
    await updateTask(id, {
      owner: s(fd, "owner"),
      roleCode: s(fd, "roleCode"),
      startDate: s(fd, "startDate"),
      endDate: s(fd, "endDate"),
      workDays: n(fd, "workDays"),
    });
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not update task");
  }
  refresh();
  back("Task updated");
}

export async function deleteTaskAction(fd: FormData) {
  await ensureEditor();
  try {
    await deleteTask(n(fd, "id"));
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not delete task");
  }
  refresh();
  back("Task deleted");
}

/* ------------------------------- team ------------------------------------ */

export async function createMemberAction(fd: FormData) {
  await ensureEditor();
  try {
    await createMember({
      name: s(fd, "name"),
      title: s(fd, "title"),
      roleCode: s(fd, "roleCode"),
      lead: fd.get("lead") === "on",
    });
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not add member");
  }
  refresh();
  back("Team member onboarded");
}

export async function deleteMemberAction(fd: FormData) {
  await ensureEditor();
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
  await ensureAdmin();
  try {
    await createUser({
      email: s(fd, "email"),
      name: s(fd, "name"),
      role: s(fd, "role") as Role,
      password: String(fd.get("password") ?? ""),
    });
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not create user");
  }
  refresh();
  back("User account created");
}

export async function setUserRoleAction(fd: FormData) {
  await ensureAdmin();
  try {
    await setUserRole(n(fd, "id"), s(fd, "role") as Role);
  } catch (e) {
    fail(e instanceof Error ? e.message : "Could not change role");
  }
  refresh();
  back("Role updated");
}

export async function deleteUserAction(fd: FormData) {
  const me = await ensureAdmin();
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
  await ensureAdmin();
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
