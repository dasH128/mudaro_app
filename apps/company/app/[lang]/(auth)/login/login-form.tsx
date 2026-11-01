"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import type { Locale } from "@/app/i18n/config";
import type { Dictionary } from "@/app/i18n/get-dictionary";
import { ROUTES, localePath } from "@/app/lib/routes";
import { signInAction } from "@/features/auth/application/actions/sign-in";
import { IDLE, type SignInState } from "@/features/auth/application/actions/state";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const linkClass =
  "font-medium text-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm";

type LoginFormProps = {
  lang: Locale;
  t: Dictionary["auth"]["login"];
  /** Destino tras entrar (ya validado en la página; la acción lo valida otra vez). */
  next?: string;
  /** Error que llega por la URL (`?error=no-access`), cuando el servidor expulsó una sesión sin acceso. */
  initialError?: "noAccess";
};

export function LoginForm({ lang, t, next, initialError }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signInAction, IDLE);
  const errorCode = state.status === "error" ? state.code : initialError;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="lang" value={lang} />
      {next && <input type="hidden" name="next" value={next} />}

      {errorCode && (
        <p
          role="alert"
          className="rounded-xl border border-danger-border bg-danger-surface px-4 py-3 text-sm font-medium text-danger-foreground"
        >
          {t.errors[errorCode]}
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            {t.password}
          </label>
          <Link href={localePath(lang, ROUTES.auth.forgotPassword)} className={`${linkClass} text-sm`}>
            {t.forgotPassword}
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t.hidePassword : t.showPassword}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-1 my-1 grid w-10 place-items-center rounded-lg text-muted hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="m3 3 18 18" />}
            </svg>
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0 disabled:opacity-60"
      >
        {pending ? t.submitting : t.submit}
      </button>

      <p className="pt-2 text-center text-sm text-muted">
        {t.noAccount}{" "}
        <Link href={localePath(lang, ROUTES.auth.register)} className={linkClass}>
          {t.createAccount}
        </Link>
      </p>
    </form>
  );
}
