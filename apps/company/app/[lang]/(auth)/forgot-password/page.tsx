import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { ForgotPasswordForm } from "./forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.forgotPasswordTitle };
}

export default async function ForgotPasswordPage() {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const { forgot } = (await getDictionary()).auth;

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 sm:p-10">
      <ForgotPasswordForm lang={locale} t={forgot} />
    </div>
  );
}
