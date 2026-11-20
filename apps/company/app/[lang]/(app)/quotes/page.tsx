import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale } from "@/app/i18n/config";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { todayLisbon } from "@/app/lib/format";
import { DEFAULT_SORT, countByStatus, filterQuotes, isSort, isStatus, sortQuotes, summarize } from "@/features/quotes/domain/filters";
import { applyExpiry } from "@/features/quotes/domain/status";
import { getQuotesOverview } from "@/features/quotes/infrastructure/quotes.repo";
import { QuotesHeader } from "@/features/quotes/presentation/components/quotes-header";
import { QuotesTable } from "@/features/quotes/presentation/components/quotes-table";
import { QuotesToolbar } from "@/features/quotes/presentation/components/quotes-toolbar";
import { ReadyOrders } from "@/features/quotes/presentation/components/ready-orders";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.quotesTitle };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Solo los administradores entran en el panel (requireCompanySession), así que ven el margen (RNF-03).
// Si se admite otro rol en el panel, este valor debe salir del rol de la sesión.
const CAN_SEE_MARGIN = true;

export default async function QuotesPage({ searchParams }: PageProps<"/[lang]/quotes">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  await requireCompanySession(locale);

  const t = (await getDictionary()).app.quotes;

  const params = await searchParams;
  const statusParam = first(params.status);
  const sortParam = first(params.sort);
  const status = isStatus(statusParam) ? statusParam : undefined;
  const sort = isSort(sortParam) ? sortParam : DEFAULT_SORT;
  const q = first(params.q)?.trim() ?? "";

  // La validez depende de la fecha de hoy: se calcula en cada petición, nunca en el prerender.
  await connection();
  const today = todayLisbon();
  const overview = await getQuotesOverview({ includeMargin: CAN_SEE_MARGIN });
  const all = applyExpiry(overview.quotes, today);
  const rows = sortQuotes(filterQuotes(all, status, q), sort);

  return (
    <>
      <QuotesHeader lang={locale} t={t} summary={summarize(all)} metrics={overview.metrics} />
      <ReadyOrders lang={locale} t={t} orders={overview.readyOrders} />
      <QuotesToolbar
        lang={locale}
        t={t}
        status={status}
        q={q}
        sort={sort}
        total={all.length}
        counts={countByStatus(all)}
      />
      <QuotesTable lang={locale} t={t} rows={rows} total={all.length} today={today} showMargin={CAN_SEE_MARGIN} />
    </>
  );
}
