"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { Locale } from "@/app/i18n/config";
import type { Dictionary } from "@/app/i18n/get-dictionary";
import { ROUTES, localePath } from "@/app/lib/routes";
import { forgotPasswordAction } from "@/features/auth/application/actions/forgot-password";
import { IDLE, type ForgotPasswordState } from "@/features/auth/application/actions/state";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const linkClass =
  "font-medium text-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm";

type ForgotPasswordFormProps = {
  lang: Locale;
  t: Dictionary["auth"]["forgot"];
};

export function ForgotPasswordForm({ lang, t }: ForgotPasswordFormProps) {
  const [state, formAction, pending] = useActionState<ForgotPasswordState, FormData>(forgotPasswordAction, IDLE);
  const back = (
    <p className="pt-2 text-center text-sm">
      <Link href={localePath(lang, ROUTES.auth.login)} className={linkClass}>
        {t.back}
      </Link>
    </p>
  );

  if (state.status === "sent") {
    return (
      <div className="space-y-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</p>
        <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight">{t.sentTitle}</h1>
        <p role="status" className="leading-relaxed text-muted">
          {t.sentBody}
        </p>
        {back}
      </div>
    );
  }

  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight">{t.title}</h1>
      <p className="mt-3 mb-8 leading-relaxed text-muted">{t.subtitle}</p>

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
          <label htmlFor="email" className="text-sm font-medium">
            {t.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t.emailPlaceholder}
            required
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0 disabled:opacity-60"
        >
          {pending ? t.submitting : t.submit}
        </button>

        {back}
      </form>
    </>
  );
}
