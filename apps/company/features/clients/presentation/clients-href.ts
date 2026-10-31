import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { DEFAULT_FILTER, DEFAULT_SORT, type ClientFilter, type ClientSort } from "../domain/clients";

export type ClientsParams = {
  filter?: ClientFilter;
  q?: string;
  sort?: ClientSort;
  /** Cliente abierto en el panel. */
  client?: string;
};

/** Enlace a clientes con filtro, búsqueda, orden y cliente abierto en la URL. Lo que vale lo de por defecto no se escribe. */
export function clientsHref(lang: Locale, { filter, q, sort, client }: ClientsParams): string {
  const params = new URLSearchParams();
  if (filter && filter !== DEFAULT_FILTER) params.set("filter", filter);
  if (q) params.set("q", q);
  if (sort && sort !== DEFAULT_SORT) params.set("sort", sort);
  if (client) params.set("client", client);
  const query = params.toString();
  const path = localePath(lang, ROUTES.clients);
  return query ? `${path}?${query}` : path;
}
