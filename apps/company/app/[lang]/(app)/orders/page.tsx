import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { pluralize } from "@/app/i18n/interpolate";
import { formatLongDate, hourLisbon, todayLisbon } from "@/app/lib/format";
import { MOCK_USER } from "@/app/lib/mock-session";
import {
  DEFAULT_VIEW,
  PAGE_SIZE,
  countByStage,
  filterOrders,
  isFilter,
  isView,
  needsAttention,
  paginate,
  sortAttention,
  sortByActivity,
  sortForTable,
  stagesWithAttention,
  summarizeAttention,
  upcomingMoves,
} from "@/features/orders/domain/list";
import { getOrdersOverview } from "@/features/orders/infrastructure/orders.repo";
import { FooterLink, OrdersCardsList } from "@/features/orders/presentation/components/orders-cards-list";
import { OrdersListHeader } from "@/features/orders/presentation/components/orders-list-header";
import { OrdersPipeline } from "@/features/orders/presentation/components/orders-pipeline";
import { OrdersSidePanels } from "@/features/orders/presentation/components/orders-side-panels";
import { OrdersTable } from "@/features/orders/presentation/components/orders-table";
import { OrdersToolbar } from "@/features/orders/presentation/components/orders-toolbar";
import { OrdersWelcome } from "@/features/orders/presentation/components/orders-welcome";
import { UrgentOrders } from "@/features/orders/presentation/components/urgent-orders";
import { ordersHref } from "@/features/orders/presentation/orders-href";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.ordersTitle };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Entero positivo de la URL; si no lo es, el valor por defecto. */
function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? Math.min(n, 1000) : fallback;
}

/** "morning" hasta las 12 h, "afternoon" hasta las 20 h y "evening" después (hora de Lisboa). */
function periodOf(hour: number) {
  if (hour < 12) return "morning";
  return hour < 20 ? "afternoon" : "evening";
}

// TODO(auth): el grupo (app) aún no tiene sesión ni rol. Cuando exista, la página comprueba sesión y rol en servidor
// y el saludo usa el nombre del usuario de la sesión.
export default async function OrdersPage({ searchParams }: PageProps<"/[lang]/orders">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const t = (await getDictionary()).app.orders.list;

  const params = await searchParams;
  const stageParam = first(params.stage);
  const viewParam = first(params.view);
  const stage = isFilter(stageParam) ? stageParam : undefined;
  const view = isView(viewParam) ? viewParam : DEFAULT_VIEW;
  const q = first(params.q)?.trim() ?? "";
  const limit = positiveInt(first(params.limit), PAGE_SIZE);
  const pageParam = positiveInt(first(params.page), 1);

  // El saludo, las fechas relativas y "próximas mudanças" dependen de hoy: se calculan en cada petición
  await connection();
  const now = new Date();
  const today = todayLisbon(now);
  const { orders: all, metrics } = await getOrdersOverview();

  const counts = countByStage(all);
  const attention = summarizeAttention(all);
  const filtered = filterOrders(all, stage, q);
  const base = { q, view, stage };

  const summary =
    stage === undefined
      ? pluralize(locale, all.length, t.summary.all)
      : stage === "action"
        ? pluralize(locale, attention.total, t.summary.action)
        : pluralize(locale, counts[stage], t.summary.stage[stage]);

  // Vista en cartões: "Precisam de ti" arriba y el resto debajo. Con una etapa elegida solo se ve esa etapa.
  const urgent = stage === undefined || stage === "action" ? sortAttention(filterOrders(all, "action", q)) : [];
  const rest =
    stage === "action"
      ? []
      : sortByActivity(stage === undefined ? filtered.filter((item) => !needsAttention(item)) : filtered);
  const shown = rest.slice(0, limit);

  // Vista en lista: todo en una tabla paginada
  const table = paginate(sortForTable(filtered), pageParam);

  const stageTitle = stage && stage !== "action" ? t.rows.stageTitles[stage] : null;
  const searching = q !== "";

  return (
    <>
      <OrdersListHeader lang={locale} t={t} />
      <OrdersWelcome
        lang={locale}
        t={t}
        name={MOCK_USER.name}
        period={periodOf(hourLisbon(now))}
        dateLabel={formatLongDate(locale, now)}
        summary={attention}
      />
      <OrdersPipeline
        lang={locale}
        t={t}
        stage={stage}
        q={q}
        view={view}
        counts={counts}
        attention={stagesWithAttention(all)}
      />
      <OrdersToolbar
        lang={locale}
        t={t}
        stage={stage}
        q={q}
        view={view}
        total={all.length}
        actionCount={attention.total}
        counts={counts}
        summary={summary}
      />

      {view === "cards" ? (
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-7">
            <UrgentOrders lang={locale} t={t} items={urgent} today={today} />
            <OrdersCardsList
              lang={locale}
              t={t}
              title={stage === "action" ? t.rows.titleAction : (stageTitle ?? t.rows.titleAll)}
              rows={shown}
              today={today}
              empty={
                shown.length === 0 && stage !== "action"
                  ? { title: t.rows.emptyTitle, hint: searching ? t.rows.emptySearch : t.rows.emptyStage }
                  : null
              }
              footer={
                stage === "action" ? (
                  t.rows.actionFooter
                ) : rest.length > shown.length ? (
                  <>
                    {pluralize(locale, rest.length, t.table.showing, { shown: shown.length })} ·{" "}
                    <FooterLink href={ordersHref(locale, { ...base, limit: limit + PAGE_SIZE })}>{t.rows.moreShown}</FooterLink>
                  </>
                ) : stage === undefined ? (
                  pluralize(locale, rest.length, t.table.showing, { shown: shown.length })
                ) : (
                  pluralize(locale, rest.length, t.rows.stageFooter)
                )
              }
            />
          </div>
          <OrdersSidePanels lang={locale} t={t} upcoming={upcomingMoves(all, today, 4)} metrics={metrics} />
        </div>
      ) : (
        <OrdersTable
          lang={locale}
          t={t}
          title={stage === "action" ? t.urgent.title : (stageTitle ?? t.table.allTitle)}
          rows={table.rows}
          total={filtered.length}
          today={today}
          emptyMessage={searching ? t.rows.emptySearch : t.rows.emptyStage}
          pager={{
            previous: table.page > 1 ? ordersHref(locale, { ...base, page: table.page - 1 }) : null,
            next: table.page < table.pages ? ordersHref(locale, { ...base, page: table.page + 1 }) : null,
          }}
        />
      )}
    </>
  );
}
