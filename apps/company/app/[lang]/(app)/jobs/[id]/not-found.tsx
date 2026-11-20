import { lang } from "next/root-params";

import { EmptyBoxArt } from "@/app/components/error-art";
import { ErrorState } from "@/app/components/error-state";
import { DEFAULT_LOCALE, hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { ROUTES, localePath } from "@/app/lib/routes";

/** Trabajo que no existe, cancelado o de otra empresa (RLS no lo devuelve). */
export default async function JobNotFound() {
  const value = await lang();
  const locale = hasLocale(value) ? value : DEFAULT_LOCALE;
  const t = (await getDictionary()).app.errors.jobNotFound;

  return <ErrorState art={<EmptyBoxArt />} title={t.title} text={t.text} action={{ label: t.cta, href: localePath(locale, ROUTES.schedule) }} />;
}
