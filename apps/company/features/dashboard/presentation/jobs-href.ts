import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { DEFAULT_JOB_FILTER, type JobFilter } from "../domain/jobs";

/** Enlace a Início con el filtro y la búsqueda de "Trabalhos de hoje" en la URL. Lo que vale lo de por defecto no se escribe. */
export function jobsHref(lang: Locale, { filter, q }: { filter?: JobFilter; q?: string }): string {
  const params = new URLSearchParams();
  if (filter && filter !== DEFAULT_JOB_FILTER) params.set("status", filter);
  if (q) params.set("q", q);
  const query = params.toString();
  const path = localePath(lang, ROUTES.home);
  return query ? `${path}?${query}` : path;
}
