import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { Assistant } from "@/app/components/Assistant";
import { getProject, getAllTasks } from "@/app/lib/queries";
import { requireUser } from "@/app/lib/auth";
import { fmtShort, computeAlerts, computeSignoffs } from "@/app/lib/helpers";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(); // gate every /dashboard and /task route
  const [project, tasks] = await Promise.all([getProject(), getAllTasks()]);
  // Clients are nudged about deliverables awaiting their sign-off; the team about
  // overdue/blocked work plus anything the client has flagged for changes.
  let alertCount: number;
  if (user.role === "VIEWER") {
    alertCount = computeSignoffs(tasks).awaiting.length;
  } else {
    const scope =
      user.role === "EDITOR"
        ? tasks.filter((t) => t.owner === user.name || (!!user.department && t.role === user.department))
        : tasks;
    const { overdue, blocked } = computeAlerts(scope, project.asOf);
    alertCount = overdue.length + blocked.length + scope.filter((t) => t.approval === "CHANGES").length;
  }

  return (
    <>
      <SiteHeader asOf={fmtShort(project.asOf)} user={user} alertCount={alertCount} />
      <main className="flex-1">{children}</main>
      <SiteFooter project={project} />
      <Assistant name={user.name} role={user.role} />
    </>
  );
}
