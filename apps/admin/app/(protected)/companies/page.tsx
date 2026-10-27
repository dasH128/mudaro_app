import type { Metadata } from "next";

import { PageTitle } from "@/app/components/page-title";
import { ButtonLink } from "@/app/components/ui/button";
import { requirePlatformUser } from "@/app/lib/auth";
import { ROUTES } from "@/app/lib/routes";
import { isStatus } from "@/features/companies/domain/status";
import { countByStatus, filterCompanies, withStatus } from "@/features/companies/domain/filters";
import { listCompanies } from "@/features/companies/data/companies.repo";
import { CompaniesTable } from "@/features/companies/components/companies-table";
import { StatusFilters } from "@/features/companies/components/status-filters";
import { SearchBox } from "@/features/companies/components/search-box";

export const metadata: Metadata = {
  title: "Painel Mudaro · Empresas",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CompaniesPage({ searchParams }: PageProps<"/companies">) {
  // El layout no basta: los layouts no se vuelven a renderizar en cada navegación. RLS lo comprueba otra vez en la base de datos.
  await requirePlatformUser();

  const params = await searchParams;
  const statusParam = first(params.status);
  const status = isStatus(statusParam) ? statusParam : undefined;
  const q = first(params.q)?.trim() ?? "";

  const all = withStatus(await listCompanies());
  const rows = filterCompanies(all, status, q);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <PageTitle>Empresas do piloto</PageTitle>
          <p className="m-0 text-[15px] text-muted">O estado é calculado a partir dos dados de cada empresa.</p>
        </div>
        <ButtonLink href={ROUTES.companies.new}>
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

      <StatusFilters selected={status} q={q} total={all.length} counts={countByStatus(all)} />
      <SearchBox q={q} status={status} />

      <p role="status" className="sr-only">
        {rows.length === 1 ? "1 empresa" : `${rows.length} empresas`}
      </p>
      <CompaniesTable rows={rows} />
    </div>
  );
}
