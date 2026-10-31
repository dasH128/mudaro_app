import Form from "next/form";
import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { ORDER_STAGES, type OrderStage } from "@/features/orders/domain/types";
import { VIEWS, type OrdersFilter, type OrdersView } from "../../domain/list";
import { ordersHref } from "../orders-href";
import type { OrdersListText } from "../orders-text";

type Props = {
  lang: Locale;
  t: OrdersListText;
  stage: OrdersFilter | undefined;
  q: string;
  view: OrdersView;
  total: number;
  /** Pedidos que piden algo a la empresa. */
  actionCount: number;
  counts: Record<OrderStage, number>;
  /** "5 pedidos precisan de ti": se anuncia a los lectores de pantalla al cambiar el filtro. */
  summary: string;
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const chip = `inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold ${focusRing}`;
const field =
  "flex h-10 items-center rounded-full border border-status-off-border px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary";

/** Filtros por etapa, búsqueda y vista. Todo viaja en la URL (enlaces y un formulario GET), como en Frota, Equipa y Clientes. */
export function OrdersToolbar({ lang, t, stage, q, view, total, actionCount, counts, summary }: Props) {
  const filters = [
    { key: undefined, label: t.toolbar.all, count: total },
    { key: "action" as const, label: t.toolbar.action, count: actionCount },
    ...ORDER_STAGES.map((key) => ({ key, label: t.pipeline.stages[key], count: counts[key] })),
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-full border border-line bg-surface p-2">
      <div role="group" aria-label={t.pipeline.filterLabel} className="inline-flex flex-wrap gap-1">
        {filters.map((filter) => {
          const selected = filter.key === stage;
          return (
            <Link
              key={filter.key ?? "all"}
              href={ordersHref(lang, { stage: filter.key, q, view })}
              aria-current={selected ? "true" : undefined}
              className={`${chip} ${selected ? "border-foreground bg-foreground text-background" : "border-transparent text-foreground hover:bg-surface-soft"}`}
            >
              {filter.label} <span className="opacity-70">{filter.count}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* GET a la misma ruta: la búsqueda conserva la etapa y la vista */}
        <Form action={localePath(lang, ROUTES.orders.list)}>
          {stage ? <input type="hidden" name="stage" value={stage} /> : null}
          {view !== "cards" ? <input type="hidden" name="view" value={view} /> : null}
          <label className={`${field} w-52.5 gap-2`}>
            <Icon name="search" size={16} className="text-muted" />
            <span className="sr-only">{t.searchLabel}</span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t.searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-field-placeholder"
            />
          </label>
        </Form>

        <div role="group" aria-label={t.view.label} className="inline-flex gap-1 rounded-full bg-surface-head p-1">
          {VIEWS.map((key) => {
            const selected = key === view;
            return (
              <Link
                key={key}
                href={ordersHref(lang, { stage, q, view: key })}
                aria-current={selected ? "true" : undefined}
                aria-label={t.view[key]}
                title={t.view[key]}
                className={`grid size-8.5 place-items-center rounded-full ${focusRing} ${selected ? "bg-foreground text-background" : "text-foreground"}`}
              >
                <Icon name={key === "list" ? "list" : "grid"} size={16} />
              </Link>
            );
          })}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {summary}
      </p>
    </div>
  );
}
