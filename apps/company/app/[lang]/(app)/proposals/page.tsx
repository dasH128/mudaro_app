import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { todayLisbon } from "@/app/lib/format";
import { DEFAULT_SORT, countByStatus, filterProposals, isSort, isStatus, sortProposals, summarize } from "@/features/proposals/domain/filters";
import { applyExpiry } from "@/features/proposals/domain/status";
import { getProposalsOverview } from "@/features/proposals/infrastructure/proposals.repo";
import { ProposalsHeader } from "@/features/proposals/presentation/components/proposals-header";
import { ProposalsTable } from "@/features/proposals/presentation/components/proposals-table";
import { ProposalsToolbar } from "@/features/proposals/presentation/components/proposals-toolbar";
import { ReadyRequests } from "@/features/proposals/presentation/components/ready-requests";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.proposalsTitle };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// TODO(auth): el grupo (app) aún no tiene sesión ni rol. Cuando exista, el margen solo se pide
// si el rol es administrador (RNF-03) y la página comprueba sesión y rol en servidor.
const CAN_SEE_MARGIN = true;

export default async function ProposalsPage({ searchParams }: PageProps<"/[lang]/proposals">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const t = (await getDictionary()).app.proposals;

  const params = await searchParams;
  const statusParam = first(params.status);
  const sortParam = first(params.sort);
  const status = isStatus(statusParam) ? statusParam : undefined;
  const sort = isSort(sortParam) ? sortParam : DEFAULT_SORT;
  const q = first(params.q)?.trim() ?? "";

  // La validez depende de la fecha de hoy: se calcula en cada petición, nunca en el prerender.
  await connection();
  const today = todayLisbon();
  const overview = await getProposalsOverview({ includeMargin: CAN_SEE_MARGIN });
  const all = applyExpiry(overview.proposals, today);
  const rows = sortProposals(filterProposals(all, status, q), sort);

  return (
    <>
      <ProposalsHeader lang={locale} t={t} summary={summarize(all)} metrics={overview.metrics} />
      <ReadyRequests lang={locale} t={t} requests={overview.readyRequests} />
      <ProposalsToolbar
        lang={locale}
        t={t}
        status={status}
        q={q}
        sort={sort}
        total={all.length}
        counts={countByStatus(all)}
      />
      <ProposalsTable lang={locale} t={t} rows={rows} total={all.length} today={today} showMargin={CAN_SEE_MARGIN} />
    </>
  );
}
