import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { STEP_OF, isWarn, needsAttention, nextAction } from "../../domain/list";
import type { OrderListItem } from "../../domain/types";
import { describeNote, describeWhen, type OrdersListText } from "../orders-text";
import { OrderActionButton, OrderMoreButton } from "./order-action";
import { OrderAvatar } from "./order-avatar";
import { OrderIdLink } from "./order-id-link";
import { OrderStagePill } from "./order-stage-pill";
import { OrderSteps } from "./order-steps";

type Props = {
  lang: Locale;
  t: OrdersListText;
  title: string;
  rows: readonly OrderListItem[];
  /** Total tras filtrar, para "A mostrar N de M". */
  total: number;
  today: string;
  emptyMessage: string;
  /** Enlaces a la página anterior y siguiente; `null` en los extremos. */
  pager: { previous: string | null; next: string | null };
};

// Plantilla de columnas (estática para que Tailwind la genere)
const COLS = "grid-cols-[minmax(190px,1fr)_minmax(200px,1.1fr)_minmax(170px,0.9fr)_minmax(300px,1.9fr)_minmax(170px,0.8fr)]";
const cell = "flex min-w-0 flex-col gap-1 px-2.5";
const pagerButton =
  "grid size-9 place-items-center rounded-full border border-status-off-border bg-surface text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function PagerLink({ href, label, icon }: { href: string | null; label: string; icon: "chevronLeft" | "chevronRight" }) {
  const glyph = <Icon name={icon} size={16} />;
  if (!href) {
    return (
      <span role="link" aria-disabled="true" aria-label={label} className={`${pagerButton} opacity-40`}>
        {glyph}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={pagerButton}>
      {glyph}
    </Link>
  );
}

/** Vista en lista: todos los pedidos en una tabla paginada. */
export function OrdersTable({ lang, t, title, rows, total, today, emptyMessage, pager }: Props) {
  const { columns } = t.table;
  const head = [columns.client, columns.move, columns.status, columns.note, columns.next];

  return (
    <section aria-labelledby="table" className="rounded-3xl border border-line bg-surface px-2 pt-5 pb-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-4">
        <h2 id="table" className="font-display text-[22px] font-extrabold">
          {title}
        </h2>
        <span className="inline-flex items-center gap-2 text-[13px] text-muted">
          <span className="size-2 rounded-full bg-primary" />
          {t.table.legend}
        </span>
      </div>
      <div className="overflow-x-auto">
        <div role="table" aria-labelledby="table" className="min-w-260">
          <div role="row" className={`mb-1 grid items-center border-b border-line-soft ${COLS}`}>
            {head.map((label, index) => (
              <span
                key={label}
                role="columnheader"
                className={`whitespace-nowrap px-2.5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted ${index === 0 ? "pl-3" : ""} ${index === head.length - 1 ? "text-right" : ""}`}
              >
                {label}
              </span>
            ))}
          </div>

          {rows.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">{emptyMessage}</p> : null}
          {rows.map((item, index) => {
            const action = nextAction(item.note);
            const when = describeWhen(item, t, lang, today);
            return (
              // `relative`: el enlace del número de pedido se estira sobre toda la fila
              <div key={item.id} role="row" className={`relative grid min-h-16 items-center rounded-2xl py-1 hover:bg-surface-soft ${COLS}`}>
                <div role="cell" className="flex min-w-0 items-center gap-3 px-3 py-2.5">
                  <span className="relative inline-flex">
                    <OrderAvatar name={item.client} index={index} size="sm" />
                    {needsAttention(item) ? (
                      <span className="absolute -top-0.75 -right-0.75 size-3 rounded-full border-2 border-surface bg-primary" />
                    ) : null}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-bold">{item.client}</span>
                    <OrderIdLink lang={lang} id={item.id} />
                  </span>
                </div>
                <div role="cell" className={cell}>
                  <span className="text-sm font-medium">
                    {item.from} <span aria-hidden="true">→</span>
                    <span className="sr-only">{t.common.routeTo}</span> {item.to}
                  </span>
                  <span className="text-xs text-muted">
                    {when.date} · {when.countdown}
                  </span>
                </div>
                <div role="cell" className="flex min-w-0 flex-col items-start gap-1.5 px-2.5">
                  <OrderStagePill stage={item.stage} label={t.status[item.stage]} />
                  <OrderSteps stage={item.stage} label={interpolate(t.common.step, { step: STEP_OF[item.stage] })} />
                </div>
                <div role="cell" className="px-2.5">
                  <span className={`text-[13px] leading-[1.45] ${isWarn(item.note) ? "font-bold text-warn-foreground" : "text-muted"}`}>
                    {describeNote(item.note, t, lang, today)}
                  </span>
                </div>
                <div role="cell" className="flex justify-end px-2.5">
                  <span className="relative inline-flex items-center gap-1">
                    {action ? <OrderActionButton lang={lang} t={t} id={item.id} action={action} size="row" /> : null}
                    <OrderMoreButton t={t} id={item.id} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 pt-2.5 text-xs text-muted">
        <span>{pluralize(lang, total, t.table.showing, { shown: rows.length })}</span>
        <span className="flex gap-1.5">
          <PagerLink href={pager.previous} label={t.table.previous} icon="chevronLeft" />
          <PagerLink href={pager.next} label={t.table.next} icon="chevronRight" />
        </span>
      </div>
    </section>
  );
}
