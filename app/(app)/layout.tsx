import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { getProject, getAllTasks } from "@/app/lib/queries";
import { requireUser } from "@/app/lib/auth";
import { fmtShort, computeAlerts } from "@/app/lib/helpers";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(); // gate every /dashboard and /task route
  const [project, tasks] = await Promise.all([getProject(), getAllTasks()]);
  // engineers see their own alerts; managers & clients see the whole programme
  const scope = user.role === "EDITOR" ? tasks.filter((t) => t.owner === user.name) : tasks;
  const { overdue, blocked } = computeAlerts(scope, project.asOf);
  const alertCount = overdue.length + blocked.length;

  return (
    <>
      <SiteHeader asOf={fmtShort(project.asOf)} user={user} alertCount={alertCount} />
      <main className="flex-1">{children}</main>
      <SiteFooter project={project} />
    </>
  );
}
