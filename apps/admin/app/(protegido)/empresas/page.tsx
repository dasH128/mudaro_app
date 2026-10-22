import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/app/lib/routes";
import { isEstado } from "./_data/estado";
import { countByEstado, filterEmpresas, withEstado } from "./_data/query";
import { listEmpresas } from "./_data/store";
import { EmpresasTable } from "./empresas-table";
import { EstadoFiltros } from "./estado-filtros";
import { SearchBox } from "./search-box";

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
          <h1 className="m-0 font-display text-[32px] leading-[1.15] font-extrabold tracking-[-0.02em]">
            Empresas do piloto
          </h1>
          <p className="m-0 text-[15px] text-muted">O estado é calculado a partir dos dados de cada empresa.</p>
        </div>
        <Link
          href={ROUTES.empresas.new}
          className="box-border inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-[15px] font-bold text-primary-foreground no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
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
        </Link>
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
