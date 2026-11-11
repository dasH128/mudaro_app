import "server-only";

import { redirect } from "next/navigation";

import { DEFAULT_LOCALE, hasLocale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { blockedReasonOf, type CompanySession } from "@/features/auth/domain/session";
import { getCompanySession } from "@/features/auth/infrastructure/session.repo";

/**
 * Comprueba sesión y rol en servidor. Se llama al empezar cada página protegida y cada Server Action:
 * el proxy solo redirige y RLS es la última barrera (CLAUDE.md, seguridad 3).
 * `lang` puede venir de un FormData, así que se valida antes de usarlo en la redirección.
 */
export async function requireCompanySession(lang: unknown): Promise<CompanySession> {
  const locale = typeof lang === "string" && hasLocale(lang) ? lang : DEFAULT_LOCALE;
  const result = await getCompanySession();

  if (result.status === "anonymous") redirect(localePath(locale, ROUTES.auth.login));
  // Bloqueada: la página de acceso bloqueado vuelve a leer la sesión para explicar el motivo (no va en la URL)
  if (result.status !== "ok" || blockedReasonOf(result)) redirect(localePath(locale, ROUTES.auth.noAccess));
  return result.session;
}
