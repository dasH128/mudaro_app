"use client";

import { useActionState } from "react";

import type { Locale } from "@/app/i18n/config";
import type { Dictionary } from "@/app/i18n/get-dictionary";
import { setPasswordAction } from "@/features/auth/actions/set-password";
import { IDLE, type SetPasswordState } from "@/features/auth/actions/state";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

type SetPasswordFormProps = {
  lang: Locale;
  t: Dictionary["auth"]["setPassword"];
};

export function SetPasswordForm({ lang, t }: SetPasswordFormProps) {
  const [state, formAction, pending] = useActionState<SetPasswordState, FormData>(setPasswordAction, IDLE);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="lang" value={lang} />

      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-xl border border-danger-border bg-danger-surface px-4 py-3 text-sm font-medium text-danger-foreground"
        >
          {t.errors[state.code]}
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          {t.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby="password-hint"
          className={inputClass}
        />
        <p id="password-hint" className="text-sm text-muted">
          {t.hint}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirm_password" className="text-sm font-medium">
          {t.confirmPassword}
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0 disabled:opacity-60"
      >
        {pending ? t.saving : t.submit}
      </button>
    </form>
  );
}
