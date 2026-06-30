"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/lib/actions";

export function LoginForm({ from }: { from: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={from} />

      <label className="block">
        <span className="mono-label">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="you@aapaavani.com"
          className="mt-2 w-full rounded-xl border border-black/12 bg-black/[0.03] px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/60"
        />
      </label>

      <label className="block">
        <span className="mono-label">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="mt-2 w-full rounded-xl border border-black/12 bg-black/[0.03] px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/60"
        />
      </label>

      {state.error && (
        <p className="rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand-bright">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors enabled:hover:bg-brand-bright disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
