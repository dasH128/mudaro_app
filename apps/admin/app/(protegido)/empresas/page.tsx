import type { Metadata } from "next";

import { PageTitle } from "@/app/components/page-title";
import { ButtonLink } from "@/app/components/ui/button";
import { ROUTES } from "@/app/lib/routes";
import { isEstado } from "@/features/empresas/domain/estado";
import { countByEstado, filterEmpresas, withEstado } from "@/features/empresas/domain/filtros";
import { listEmpresas } from "@/features/empresas/data/empresas.repo";
import { EmpresasTable } from "@/features/empresas/components/empresas-table";
import { EstadoFiltros } from "@/features/empresas/components/estado-filtros";
import { SearchBox } from "@/features/empresas/components/search-box";

export const metadata: Metadata = {
  title: "Painel Mudaro · Empresas",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EmpresasPage({ searchParams }: PageProps<"/empresas">) {
  const params = await searchParams;
  const estadoParam = first(params.estado);
  const estado = isEstado(estadoParam) ? estadoParam : undefined;
  const q = first(params.q)?.trim() ?? "";

  const all = withEstado(await listEmpresas());
  const rows = filterEmpresas(all, estado, q);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <PageTitle>Empresas do piloto</PageTitle>
          <p className="m-0 text-[15px] text-muted">O estado é calculado a partir dos dados de cada empresa.</p>
        </div>
        <ButtonLink href={ROUTES.empresas.new}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Nova empresa
        </ButtonLink>
      </div>

      <EstadoFiltros selected={estado} q={q} total={all.length} counts={countByEstado(all)} />
      <SearchBox q={q} estado={estado} />

      <p role="status" className="sr-only">
        {rows.length === 1 ? "1 empresa" : `${rows.length} empresas`}
      </p>
      <EmpresasTable rows={rows} />
    </div>
  );
}
