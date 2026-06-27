import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { getProject } from "@/app/lib/queries";
import { requireUser } from "@/app/lib/auth";
import { fmtShort } from "@/app/lib/helpers";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(); // gate every /dashboard and /task route
  const project = await getProject();
  return (
    <>
      <SiteHeader asOf={fmtShort(project.asOf)} user={user} />
      <main className="flex-1">{children}</main>
      <SiteFooter project={project} />
    </>
  );
}
