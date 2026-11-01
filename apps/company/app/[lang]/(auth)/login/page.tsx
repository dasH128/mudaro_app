import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { ROUTES, localePath } from "@/app/lib/routes";
import { canAccessPanel } from "@/features/auth/domain/session";
import { safeNextPath } from "@/features/auth/domain/redirect";
import { getCompanySession } from "@/features/auth/infrastructure/session.repo";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.loginTitle };
}

// La sesión y searchParams son datos de la petición: se leen dentro de Suspense (Cache Components).
async function Login({ searchParams }: { searchParams: PageProps<"/[lang]/login">["searchParams"] }) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const home = localePath(locale, ROUTES.home);
  const params = await searchParams;
  const next = safeNextPath(params.next, locale, home);

  // Quien ya tiene sesión de empresa no necesita ver el login.
  const current = await getCompanySession();
  if (current.status === "ok" && canAccessPanel(current.session.role)) redirect(next);

  const { login } = (await getDictionary()).auth;

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{login.eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight">
        {login.title}
      </h1>
      <p className="mt-3 mb-8 leading-relaxed text-muted">{login.subtitle}</p>
      <LoginForm
        lang={locale}
        t={login}
        next={next === home ? undefined : next}
        initialError={params.error === "no-access" ? "noAccess" : undefined}
      />
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/[lang]/login">) {
  return (
    <Suspense>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}
