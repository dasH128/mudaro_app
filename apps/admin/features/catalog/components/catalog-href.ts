import { ROUTES } from "@/app/lib/routes";
import type { ObjectFilters } from "../domain/filters";
import type { CatalogTab } from "../domain/types";

/** Construye /catalog?tab=...&q=... omitiendo lo vacío y los valores por defecto. */
export function catalogHref(tab: CatalogTab, filters?: Partial<ObjectFilters>): string {
  const params = new URLSearchParams();
  if (tab !== "objects") params.set("tab", tab);
  if (tab === "objects" && filters) {
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    if (filters.room) params.set("room", filters.room);
    if (filters.mark) params.set("mark", filters.mark);
    if (filters.state && filters.state !== "active") params.set("state", filters.state);
  }
  const query = params.toString();
  return query ? `${ROUTES.catalog.list}?${query}` : ROUTES.catalog.list;
}
