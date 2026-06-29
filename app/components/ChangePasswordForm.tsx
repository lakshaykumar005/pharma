"use client";

import { useActionState } from "react";
import { changePasswordAction, type PasswordState } from "@/app/lib/actions";

const input =
  "mt-1 w-full rounded-lg border border-black/12 bg-black/[0.03] px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/60";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="mt-4 max-w-sm space-y-3">
      <label className="block">
        <span className="mono-label text-[0.55rem]">Current password</span>
        <input name="current" type="password" autoComplete="current-password" required className={input} />
      </label>
      <label className="block">
        <span className="mono-label text-[0.55rem]">New password</span>
        <input name="next" type="password" autoComplete="new-password" required minLength={6} className={input} />
      </label>
      <label className="block">
        <span className="mono-label text-[0.55rem]">Confirm new password</span>
        <input name="confirm" type="password" autoComplete="new-password" required minLength={6} className={input} />
      </label>
      {state.error && <p className="text-xs text-brand">{state.error}</p>}
      {state.ok && <p className="text-xs text-emerald-600">{state.ok}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors enabled:hover:bg-brand-bright disabled:opacity-40"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
