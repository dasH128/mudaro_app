import { ROUTES } from "@/app/lib/routes";
import type { EstadoEmpresa } from "@/features/empresas/domain/estado";

/** Construye /empresas?estado=...&q=... omitiendo lo vacío. */
export function empresasHref(estado: EstadoEmpresa | undefined, q: string): string {
  const params = new URLSearchParams();
  if (estado) params.set("estado", estado);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `${ROUTES.empresas.list}?${query}` : ROUTES.empresas.list;
}
