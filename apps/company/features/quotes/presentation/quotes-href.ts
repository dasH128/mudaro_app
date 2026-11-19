import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { DEFAULT_SORT, type QuoteSort } from "@/features/quotes/domain/filters";
import type { QuoteStatus } from "@/features/quotes/domain/types";

type Filters = { status?: QuoteStatus; q?: string; sort?: QuoteSort };

/** Enlace a la lista con filtros en la URL. Lo que vale lo de por defecto no se escribe. */
export function quotesHref(lang: Locale, { status, q, sort }: Filters): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (sort && sort !== DEFAULT_SORT) params.set("sort", sort);
  const query = params.toString();
  const path = localePath(lang, ROUTES.quotes.list);
  return query ? `${path}?${query}` : path;
}
