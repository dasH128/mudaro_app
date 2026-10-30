import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { DEFAULT_TAB, type DetailTab } from "../domain/detail";
import { DEFAULT_VIEW, PAGE_SIZE, type OrderAction, type OrdersFilter, type OrdersView } from "../domain/list";

type Filters = { stage?: OrdersFilter; q?: string; view?: OrdersView; limit?: number; page?: number };

/** Enlace a la lista con filtros en la URL. Lo que vale lo de por defecto no se escribe. */
export function ordersHref(lang: Locale, { stage, q, view, limit, page }: Filters): string {
  const params = new URLSearchParams();
  if (stage) params.set("stage", stage);
  if (q) params.set("q", q);
  if (view && view !== DEFAULT_VIEW) params.set("view", view);
  if (limit && limit > PAGE_SIZE) params.set("limit", String(limit));
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  const path = localePath(lang, ROUTES.orders.list);
  return query ? `${path}?${query}` : path;
}

/**
 * Destino del siguiente paso, o `null` si aún no se puede hacer.
 * Reenviar o copiar el enlace dependen de generarlo (RF-15, pendiente) y "Ver trabalho" aún no tiene pantalla.
 */
export function actionHref(lang: Locale, action: OrderAction, id: string): string | null {
  switch (action) {
    case "create-proposal":
    case "continue-proposal":
      return `${localePath(lang, ROUTES.proposals.new)}?${new URLSearchParams({ request: id })}`;
    case "share-link":
      return localePath(lang, ROUTES.orders.created(id));
    case "fill-inventory":
      return localePath(lang, ROUTES.orders.inventory(id));
    case "view-proposal":
      return localePath(lang, ROUTES.proposals.list);
    case "resend-link":
    case "copy-link":
    case "view-job":
      return null;
  }
}

/** Enlace al detalle de un pedido con su pestaña en la URL. La pestaña por defecto no se escribe. */
export function orderDetailHref(lang: Locale, id: string, tab: DetailTab = DEFAULT_TAB): string {
  const path = localePath(lang, ROUTES.orders.detail(id));
  return tab === DEFAULT_TAB ? path : `${path}?${new URLSearchParams({ tab })}`;
}
