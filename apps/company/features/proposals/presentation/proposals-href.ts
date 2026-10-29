import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { DEFAULT_SORT, type ProposalSort } from "@/features/proposals/domain/filters";
import type { ProposalStatus } from "@/features/proposals/domain/types";

type Filters = { status?: ProposalStatus; q?: string; sort?: ProposalSort };

/** Enlace a la lista con filtros en la URL. Lo que vale lo de por defecto no se escribe. */
export function proposalsHref(lang: Locale, { status, q, sort }: Filters): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (sort && sort !== DEFAULT_SORT) params.set("sort", sort);
  const query = params.toString();
  const path = localePath(lang, ROUTES.proposals.list);
  return query ? `${path}?${query}` : path;
}
