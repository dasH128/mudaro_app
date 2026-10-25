import { ROUTES } from "@/app/lib/routes";
import type { CompanyStatus } from "@/features/companies/domain/status";

/** Construye /companies?estado=...&q=... omitiendo lo vacío. */
export function companiesHref(status: CompanyStatus | undefined, q: string): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `${ROUTES.companies.list}?${query}` : ROUTES.companies.list;
}
