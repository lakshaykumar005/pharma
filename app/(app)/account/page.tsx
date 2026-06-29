import { requireUser, roleLabel } from "@/app/lib/auth";
import { ChangePasswordForm } from "@/app/components/ChangePasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account — Command Center" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  return (
    <div className="mx-auto max-w-[700px] px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <span className="mono-label text-brand-bright">Account</span>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Your account</h1>

      <div className="card mt-6 p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/15 font-mono text-sm text-brand-bright">
            {user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="text-base font-semibold text-ink">{user.name}</p>
            <p className="text-sm text-mute">{user.email}</p>
          </div>
          <span className="ml-auto rounded-full border border-black/12 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-mute">
            {roleLabel(user.role)} · {user.role}
          </span>
        </div>
      </div>

      <div className="card mt-5 p-6">
        <p className="mono-label">Change password</p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
