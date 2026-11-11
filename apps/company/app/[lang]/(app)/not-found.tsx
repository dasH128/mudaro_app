import { lang } from "next/root-params";

import { UnknownBoxArt } from "@/app/components/error-art";
import { ErrorState } from "@/app/components/error-state";
import { DEFAULT_LOCALE, hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { ROUTES, localePath } from "@/app/lib/routes";

/**
 * 404 genérico del panel: URL que no existe (la captura `[...missing]`) o `notFound()` sin uno más concreto.
 * Un recurso de otra empresa también acaba aquí o en el 404 de su zona: nunca se dice "sin permiso" (RNF-01).
 */
export default async function AppNotFound() {
  const value = await lang();
  const locale = hasLocale(value) ? value : DEFAULT_LOCALE;
  const t = (await getDictionary()).app.errors.notFound;

  return (
    <ErrorState
      art={<UnknownBoxArt />}
      title={t.title}
      text={t.text}
      action={{ label: t.cta, href: localePath(locale, ROUTES.home) }}
    />
  );
}
