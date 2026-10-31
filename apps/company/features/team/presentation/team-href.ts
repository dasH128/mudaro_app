import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import {
  DEFAULT_FILTER,
  DEFAULT_SORT,
  DEFAULT_VIEW,
  type TeamFilter,
  type TeamSort,
  type TeamView,
} from "../domain/team";

export type TeamParams = {
  filter?: TeamFilter;
  q?: string;
  sort?: TeamSort;
  view?: TeamView;
  /** Persona abierta en el panel. */
  person?: string;
};

/** Enlace al equipo con filtros, orden, vista y persona abierta en la URL. Lo que vale lo de por defecto no se escribe. */
export function teamHref(lang: Locale, { filter, q, sort, view, person }: TeamParams): string {
  const params = new URLSearchParams();
  if (filter && filter !== DEFAULT_FILTER) params.set("filter", filter);
  if (q) params.set("q", q);
  if (sort && sort !== DEFAULT_SORT) params.set("sort", sort);
  if (view && view !== DEFAULT_VIEW) params.set("view", view);
  if (person) params.set("person", person);
  const query = params.toString();
  const path = localePath(lang, ROUTES.team);
  return query ? `${path}?${query}` : path;
}
