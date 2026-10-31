import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import {
  DEFAULT_FILTER,
  DEFAULT_SORT,
  DEFAULT_VIEW,
  type FleetFilter,
  type FleetSort,
  type FleetView,
} from "../domain/fleet";

export type FleetParams = {
  filter?: FleetFilter;
  q?: string;
  sort?: FleetSort;
  view?: FleetView;
  /** Vehículo abierto en el panel. */
  vehicle?: string;
};

/** Enlace a la frota con filtros, orden, vista y vehículo abierto en la URL. Lo que vale lo de por defecto no se escribe. */
export function fleetHref(lang: Locale, { filter, q, sort, view, vehicle }: FleetParams): string {
  const params = new URLSearchParams();
  if (filter && filter !== DEFAULT_FILTER) params.set("filter", filter);
  if (q) params.set("q", q);
  if (sort && sort !== DEFAULT_SORT) params.set("sort", sort);
  if (view && view !== DEFAULT_VIEW) params.set("view", view);
  if (vehicle) params.set("vehicle", vehicle);
  const query = params.toString();
  const path = localePath(lang, ROUTES.fleet.list);
  return query ? `${path}?${query}` : path;
}
