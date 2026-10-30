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

const th = "bg-surface-head px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-muted";
const td = "border-b border-line-soft px-3.5 py-3.5 align-middle";
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

  return (
    <section aria-labelledby="table" className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h2 id="table" className="font-display text-[22px] font-extrabold">
          {title}
        </h2>
        <span className="inline-flex items-center gap-2 text-[13px] text-muted">
          <span className="size-2 rounded-full bg-primary" />
          {t.table.legend}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-260 border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th scope="col" className={`${th} rounded-l-xl`}>{columns.client}</th>
              <th scope="col" className={th}>{columns.move}</th>
              <th scope="col" className={th}>{columns.status}</th>
              <th scope="col" className={th}>{columns.note}</th>
              <th scope="col" className={`${th} rounded-r-xl text-right`}>{columns.next}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3.5 py-10 text-center text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {rows.map((item, index) => {
              const action = nextAction(item.note);
              const when = describeWhen(item, t, lang, today);
              return (
                <tr key={item.id} className="relative hover:bg-surface-soft">
                  <td className={td}>
                    <span className="flex items-center gap-3">
                      <span className="relative inline-flex">
                        <OrderAvatar name={item.client} index={index} size="sm" />
                        {needsAttention(item) ? (
                          <span className="absolute -top-0.75 -right-0.75 size-3 rounded-full border-2 border-surface bg-primary" />
                        ) : null}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-bold">{item.client}</span>
                        <OrderIdLink lang={lang} id={item.id} />
                      </span>
                    </span>
                  </td>
                  <td className={td}>
                    <div className="whitespace-nowrap font-medium">
                      {item.from} <span aria-hidden="true">→</span>
                      <span className="sr-only">{t.common.routeTo}</span> {item.to}
                    </div>
                    <div className="whitespace-nowrap text-[13px] text-muted">
                      {when.date} · {when.countdown}
                    </div>
                  </td>
                  <td className={td}>
                    <span className="flex flex-col items-start gap-1.5">
                      <OrderStagePill stage={item.stage} label={t.status[item.stage]} />
                      <OrderSteps stage={item.stage} label={interpolate(t.common.step, { step: STEP_OF[item.stage] })} />
                    </span>
                  </td>
                  <td className={`${td} max-w-80`}>
                    <span className={`text-[13px] leading-[1.45] ${isWarn(item.note) ? "font-bold text-warn-foreground" : "text-muted"}`}>
                      {describeNote(item.note, t, lang, today)}
                    </span>
                  </td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <span className="relative inline-flex items-center gap-1">
                      {action ? <OrderActionButton lang={lang} t={t} id={item.id} action={action} size="row" /> : null}
                      <OrderMoreButton t={t} id={item.id} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1 text-[13px] text-muted">
        <span>{pluralize(lang, total, t.table.showing, { shown: rows.length })}</span>
        <span className="flex gap-1.5">
          <PagerLink href={pager.previous} label={t.table.previous} icon="chevronLeft" />
          <PagerLink href={pager.next} label={t.table.next} icon="chevronRight" />
        </span>
      </div>
    </section>
  );
}
