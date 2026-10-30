import Link from "next/link";
import type { ReactNode } from "react";

import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { STEP_OF, nextAction } from "../../domain/list";
import type { OrderListItem } from "../../domain/types";
import { describeNote, describeWhen, type OrdersListText } from "../orders-text";
import { OrderActionButton, OrderMoreButton } from "./order-action";
import { OrderAvatar } from "./order-avatar";
import { OrderStagePill } from "./order-stage-pill";
import { OrderSteps } from "./order-steps";

type Props = {
  lang: Locale;
  t: OrdersListText;
  title: string;
  rows: readonly OrderListItem[];
  today: string;
  /** Texto cuando no hay filas; `null` si la lista vacía es lo esperado (p. ej. "Mais nada urgente"). */
  empty: { title: string; hint: string } | null;
  footer: ReactNode;
};

/** Lista compacta de los pedidos que no están en "Precisam de ti". */
export function OrdersCardsList({ lang, t, title, rows, today, empty, footer }: Props) {
  return (
    <section aria-labelledby="rest" className="flex flex-col rounded-[20px] border border-line bg-surface px-2 pt-2 pb-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 pb-2.5">
        <h2 id="rest" className="font-display text-[22px] font-extrabold">
          {title}
        </h2>
        <span className="text-[13px] text-muted">{t.rows.sorted}</span>
      </div>
      <ul className="flex flex-col">
        {rows.map((item, index) => {
          const action = nextAction(item.note);
          const when = describeWhen(item, t, lang, today);
          return (
            <li key={item.id} className="flex flex-wrap items-center gap-x-4.5 gap-y-3 rounded-[14px] px-4 py-3.5 hover:bg-surface-soft">
              <OrderAvatar name={item.client} index={index + 2} size="sm" />
              <span className="flex min-w-0 flex-[1_1_170px] flex-col">
                <span className="font-bold">{item.client}</span>
                <span className="text-[13px] text-muted">
                  {item.id} · {item.from} <span aria-hidden="true">→</span>
                  <span className="sr-only">{t.common.routeTo}</span> {item.to}
                </span>
              </span>
              <span className="flex min-w-0 flex-[2_1_260px] flex-col gap-1.5">
                <span className="flex flex-wrap items-center gap-2">
                  <OrderStagePill stage={item.stage} label={t.status[item.stage]} />
                  <OrderSteps stage={item.stage} label={interpolate(t.common.step, { step: STEP_OF[item.stage] })} />
                </span>
                <span className="text-[13px] text-muted">{describeNote(item.note, t, lang, today)}</span>
              </span>
              <span className="flex flex-[0_1_150px] flex-col text-[13px] text-muted">
                <strong className="text-sm text-foreground">{when.date}</strong>
                {when.countdown}
              </span>
              <span className="ml-auto inline-flex items-center gap-1">
                {action ? <OrderActionButton lang={lang} t={t} id={item.id} action={action} size="row" /> : null}
                <OrderMoreButton t={t} id={item.id} />
              </span>
            </li>
          );
        })}
      </ul>
      {empty ? (
        <div className="flex flex-col items-center gap-3 px-4 pt-8 pb-6 text-center">
          <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" className="fill-primary" />
            <circle cx="36" cy="36" r="13" className="fill-on-ink" />
            <circle cx="36" cy="36" r="7" className="fill-sidebar" />
          </svg>
          <span className="font-bold">{empty.title}</span>
          <span className="text-sm text-muted">{empty.hint}</span>
        </div>
      ) : null}
      <div className="px-4 pt-2.5 pb-1 text-[13px] text-muted">{footer}</div>
    </section>
  );
}

/** Enlace de texto del pie ("Ver mais"). */
export function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-bold text-foreground underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      {children}
    </Link>
  );
}
