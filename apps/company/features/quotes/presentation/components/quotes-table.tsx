import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatEuro, formatPercent, formatVolume } from "@/app/lib/format";
import { orderDetailHref } from "@/features/orders/presentation/orders-href";
import { deriveValidity } from "@/features/quotes/domain/status";
import type { Quote } from "@/features/quotes/domain/types";
import { describeValidity, type QuotesText } from "../quotes-text";
import { StatusPill } from "./status-pill";

type Props = {
  lang: Locale;
  t: QuotesText;
  rows: readonly Quote[];
  /** Total de presupuestos sin filtrar, para "A mostrar N de M". */
  total: number;
  today: string;
  /** Solo administradores (RNF-03). */
  showMargin: boolean;
};

// Plantillas de columnas (estáticas para que Tailwind las genere)
const COLS_MARGIN =
  "grid-cols-[minmax(110px,0.8fr)_minmax(190px,1.4fr)_minmax(90px,0.6fr)_minmax(110px,0.7fr)_minmax(80px,0.5fr)_minmax(160px,1.1fr)_minmax(110px,0.8fr)_44px]";
const COLS_NO_MARGIN =
  "grid-cols-[minmax(110px,0.8fr)_minmax(190px,1.4fr)_minmax(90px,0.6fr)_minmax(110px,0.7fr)_minmax(160px,1.1fr)_minmax(110px,0.8fr)_44px]";

const cell = "flex min-w-0 flex-col gap-1 px-2.5";
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function QuotesTable({ lang, t, rows, total, today, showMargin }: Props) {
  const { columns, list } = t;
  const cols = showMargin ? COLS_MARGIN : COLS_NO_MARGIN;
  const head = [
    columns.quote,
    columns.clientRoute,
    columns.volume,
    columns.total,
    ...(showMargin ? [columns.margin] : []),
    columns.validity,
    columns.status,
  ];

  return (
    <section aria-labelledby="list" className="overflow-x-auto rounded-3xl border border-line bg-surface px-2 pt-2 pb-3">
      <h2 id="list" className="sr-only">
        {list.title}
      </h2>
      <div role="table" aria-labelledby="list" className={showMargin ? "min-w-225" : "min-w-205"}>
        <div role="row" className={`mb-1 grid items-center border-b border-line-soft ${cols}`}>
          {head.map((label, index) => (
            <span
              key={label}
              role="columnheader"
              className={`px-2.5 py-3 text-[11px] leading-tight font-bold uppercase tracking-[0.12em] text-muted ${index === 0 ? "pl-3" : ""}`}
            >
              {label}
            </span>
          ))}
          <span role="columnheader">
            <span className="sr-only">{columns.open}</span>
          </span>
        </div>

        {rows.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">{list.empty}</p> : null}
        {rows.map((quote) => {
          const validity = describeValidity(deriveValidity(quote, today), t, lang, today);
          // El detalle de cada versión vive en la pestaña Orçamentos del pedido
          const href = orderDetailHref(lang, quote.orderId, "quotes");
          return (
            // Todas las versiones de un presupuesto comparten número (RF-42)
            <div key={`${quote.id}-v${quote.version}`} role="row" className={`grid min-h-16 items-center rounded-2xl hover:bg-surface-soft ${cols}`}>
              <div role="cell" className="flex min-w-0 flex-col gap-0.75 px-3 py-2.5">
                <Link href={href} className={`w-fit text-[15px] font-bold whitespace-nowrap text-foreground hover:underline ${focusRing}`}>
                  {quote.id}
                </Link>
                <span className="text-xs text-muted">
                  v{quote.version} · {quote.orderId}
                </span>
              </div>
              <div role="cell" className={cell}>
                <span className="font-bold">{quote.client}</span>
                <span className="text-xs text-muted">
                  {quote.from} <span aria-hidden="true">→</span>
                  <span className="sr-only">{list.routeTo}</span> {quote.to}
                </span>
              </div>
              <div role="cell" className="px-2.5 text-sm whitespace-nowrap">
                {formatVolume(quote.volumeM3)}
              </div>
              <div role="cell" className="px-2.5 text-sm font-bold whitespace-nowrap">
                {formatEuro(quote.totalCents)}
              </div>
              {showMargin ? (
                <div role="cell" className="px-2.5 text-sm whitespace-nowrap">
                  {quote.marginPercent === null ? "" : formatPercent(quote.marginPercent / 100)}
                </div>
              ) : null}
              <div role="cell" className={cell}>
                <strong className={`text-sm ${validity.warn ? "text-warn-foreground" : ""}`}>{validity.title}</strong>
                <span className="text-xs text-muted">{validity.note}</span>
              </div>
              <div role="cell" className={cell}>
                <StatusPill status={quote.status} label={t.status[quote.status]} />
              </div>
              <div role="cell">
                <Link
                  href={href}
                  aria-label={interpolate(list.open, { id: quote.id })}
                  className={`mx-1 grid size-9 place-items-center rounded-full border border-status-off-border bg-surface text-foreground ${focusRing}`}
                >
                  <Icon name="chevronRight" size={16} strokeWidth={2.4} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 pt-2.5 text-xs text-muted">
        <span>{pluralize(lang, total, list.showing, { shown: rows.length })}</span>
        {showMargin ? (
          <span className="flex items-center gap-1.5">
            <Icon name="lock" size={14} />
            {list.marginNote}
          </span>
        ) : null}
      </div>
    </section>
  );
}
