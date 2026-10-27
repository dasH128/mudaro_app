import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { ROUTES, localePath } from "@/app/lib/routes";
import { createSupabaseServerClient } from "@mudaro/supabase/server";
import { SetPasswordForm } from "./set-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.setPasswordTitle };
}

// La sesión sale de cookies: se lee dentro de Suspense (Cache Components).
async function SetPassword() {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  // Sin sesión (enlace sin aceptar o caducado) no hay nada que definir.
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(localePath(locale, ROUTES.auth.login));

  const { setPassword } = (await getDictionary()).auth;

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{setPassword.eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight">{setPassword.title}</h1>
      <p className="mt-3 mb-8 leading-relaxed text-muted">{setPassword.subtitle}</p>
      <SetPasswordForm lang={locale} t={setPassword} />
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPassword />
    </Suspense>
  );
}
