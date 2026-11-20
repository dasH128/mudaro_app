import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { NewPersonForm } from "@/features/team/presentation/components/new-person-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.teamNewTitle };
}

// Alta de una persona del equipo sin cuenta (paso 6.0b). Solo administradores (requireCompanySession y la función de la base).
export default async function NewPersonPage() {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  await requireCompanySession(locale);

  const t = (await getDictionary()).app.team;

  return (
    <NewPersonForm
      lang={locale}
      t={{ team: t.title, n: t.newPerson, errors: t.panel.errors, formErrors: t.panel.data.formErrors, positions: t.positions }}
    />
  );
}
