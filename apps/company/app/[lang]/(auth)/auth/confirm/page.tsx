import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { ConfirmForm } from "./confirm-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.confirmTitle };
}

const cardClass = "w-full max-w-md rounded-2xl border border-border bg-surface p-8 sm:p-10";

// searchParams es dato de la petición: se lee dentro de Suspense (Cache Components).
async function Invitation({ searchParams }: { searchParams: PageProps<"/[lang]/auth/confirm">["searchParams"] }) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const { confirm } = (await getDictionary()).auth;
  const { token_hash: tokenHash } = await searchParams;
  const token = typeof tokenHash === "string" ? tokenHash : "";

  if (!token) {
    return (
      <div className={cardClass}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{confirm.eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight">{confirm.invalidTitle}</h1>
        <p className="mt-3 leading-relaxed text-muted">{confirm.invalidSubtitle}</p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{confirm.eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight">{confirm.title}</h1>
      <p className="mt-3 mb-8 leading-relaxed text-muted">{confirm.subtitle}</p>
      <ConfirmForm lang={locale} tokenHash={token} t={confirm} />
    </div>
  );
}

export default function ConfirmPage({ searchParams }: PageProps<"/[lang]/auth/confirm">) {
  return (
    <Suspense>
      <Invitation searchParams={searchParams} />
    </Suspense>
  );
}
