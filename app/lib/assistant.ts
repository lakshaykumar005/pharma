import "server-only";
import { getProject, getAllTasks } from "./queries";
import { computeAlerts, computeSignoffs, statusOf, daysBetween } from "./helpers";
import { DEPARTMENT_NAMES } from "./types";
import type { SessionUser, Task } from "./types";

/* Builds the system prompt that grounds the assistant in the signed-in user's
   live data. This — not fine-tuning — is what makes the bot personal: it sees
   the user's real, current tasks and alerts on every message. */

function line(t: Task, asOf: string): string {
  const dd = daysBetween(asOf, t.end);
  const due = t.pct >= 100 ? "done" : dd < 0 ? `${-dd}d overdue` : dd === 0 ? "due today" : `${dd}d left`;
  const subs = t.subtasks.length ? ` · subtasks ${t.subtasks.filter((s) => s.done).length}/${t.subtasks.length}` : "";
  return `- #${t.id} "${t.desc}" [${t.phaseCode}/${t.role}] owner:${t.owner} ${t.pct}% ${statusOf(t, asOf)} (${due})${subs}`;
}

export async function buildAssistantContext(user: SessionUser): Promise<string> {
  const [project, all] = await Promise.all([getProject(), getAllTasks()]);
  const real = all.filter((t) => t.type === "T");
  const deptName = user.department ? DEPARTMENT_NAMES[user.department] : null;

  // Scope to what this person is responsible for / cares about.
  const scope =
    user.role === "EDITOR"
      ? real.filter((t) => t.owner === user.name || (!!user.department && t.role === user.department))
      : real;

  const { overdue, blocked, dueSoon } = computeAlerts(scope, project.asOf);
  const mine = scope.filter((t) => t.owner === user.name);
  const pending = scope.filter((t) => t.pct < 100);

  const roleWord = user.role === "ADMIN" ? "Manager" : user.role === "EDITOR" ? "Engineer" : "Client";

  const parts: string[] = [];
  parts.push(
    `You are the Anthem Command Center assistant — a concise, friendly project copilot for ${project.client}'s ${project.programme}.`,
    `Built by ${project.builder}. Today is ${project.asOf}; target close ${project.end}; priority ${project.priority}.`,
    ``,
    `You are talking to ${user.name} — role: ${roleWord}${deptName ? `, department: ${deptName}` : ""}.`,
    ``,
    `GROUND RULES:`,
    `- Only discuss tasks/data shown below. Never invent tasks, dates, owners or numbers.`,
    `- Be brief and actionable. Prefer short answers and small bulleted lists. Reference tasks as their title (and #id).`,
    `- When asked what to do next, recommend by priority: overdue first, then blocked, then due-soon, then by earliest deadline. Respect dependencies.`,
    user.role === "EDITOR"
      ? `- This engineer can only act on their own / their department's tasks; tailor advice to those.`
      : user.role === "VIEWER"
        ? `- This is the client. They can comment and sign off completed work. Nudge them on items awaiting their sign-off; don't tell them to do engineering work.`
        : `- This is the manager; they can act on anything and reassign work.`,
    ``,
  );

  parts.push(`OVERALL: ${real.filter((t) => t.pct >= 100).length}/${real.length} tasks complete.`);

  if (user.role === "VIEWER") {
    const { awaiting, changes } = computeSignoffs(all.filter((t) => t.type === "T" || t.type === "M"));
    parts.push(`AWAITING YOUR SIGN-OFF (${awaiting.length}):`, ...(awaiting.slice(0, 15).map((t) => line(t, project.asOf))));
    if (changes.length) parts.push(`CHANGES YOU REQUESTED (${changes.length}):`, ...changes.map((t) => line(t, project.asOf)));
  } else {
    parts.push(
      `${user.role === "EDITOR" ? "YOUR" : "PROGRAMME"} PENDING TASKS (${pending.length}):`,
      ...pending.slice(0, 25).map((t) => line(t, project.asOf)),
    );
    if (user.role === "EDITOR" && mine.length) {
      parts.push(`(of these, ${mine.length} are assigned to you directly)`);
    }
    if (overdue.length) parts.push(`OVERDUE (${overdue.length}):`, ...overdue.map((t) => line(t, project.asOf)));
    if (blocked.length) parts.push(`BLOCKED (${blocked.length}):`, ...blocked.map((t) => line(t, project.asOf)));
    if (dueSoon.length) parts.push(`DUE WITHIN 7 DAYS (${dueSoon.length}):`, ...dueSoon.map((t) => line(t, project.asOf)));
  }

  return parts.join("\n");
}

/** First-message suggestions tailored to the role. */
export function starterPrompts(role: string): string[] {
  if (role === "VIEWER") return ["What's waiting on my sign-off?", "Summarise overall progress", "What changed recently?"];
  if (role === "EDITOR") return ["What should I work on next?", "What's overdue or blocked for me?", "Summarise my tasks"];
  return ["What needs attention across the programme?", "What's overdue or blocked?", "Suggest what to prioritise"];
}
