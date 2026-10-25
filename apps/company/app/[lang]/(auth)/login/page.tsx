import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.loginTitle };
}

export default async function LoginPage() {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const { login } = (await getDictionary()).auth;

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{login.eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight">
        {login.title}
      </h1>
      <p className="mt-3 mb-8 leading-relaxed text-muted">{login.subtitle}</p>
      <LoginForm lang={locale} t={login} />
    </div>
  );
}
