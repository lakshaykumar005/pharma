import { MarketingHeader } from "@/app/components/MarketingHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { getProject } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [project, user] = await Promise.all([getProject(), getCurrentUser()]);
  return (
    <>
      <MarketingHeader authed={!!user} />
      <main className="flex-1">{children}</main>
      <SiteFooter project={project} />
    </>
  );
}
