import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/auth";
import { getProject } from "@/app/lib/queries";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in — Command Center" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const [user, project, sp] = await Promise.all([getCurrentUser(), getProject(), searchParams]);
  if (user) redirect("/dashboard");

  const from = sp.from && sp.from.startsWith("/") ? sp.from : "/dashboard";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-220px)] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="card overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-brand-deep via-brand to-brand-bright" />
        <div className="p-7 sm:p-9">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-brand font-display text-xl text-white">
              AB
            </span>
            <div className="leading-none">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-faint">
                {project.client}
              </p>
              <p className="text-sm font-semibold text-ink">Command Center</p>
            </div>
          </div>

          <h1 className="mt-7 text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-mute">
            Authorised access only · {project.builder}. This programme data is confidential.
          </p>

          <LoginForm from={from} />

          <div className="mt-7 rounded-xl border border-black/8 bg-black/[0.02] p-4">
            <p className="mono-label">Demo access</p>
            <ul className="mt-2 space-y-1 font-mono text-[0.72rem] text-mute">
              <li>admin@aapaavani.com · anthem123 <span className="text-faint">(full edit)</span></li>
              <li>editor@aapaavani.com · editor123 <span className="text-faint">(edit)</span></li>
              <li>viewer@aapaavani.com · viewer123 <span className="text-faint">(read-only)</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
