import Link from "next/link";

import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { formatDate, formatEuro } from "@/app/lib/format";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { DetailQuote, OrderDetail } from "../../domain/detail";
import type { OrdersText } from "../orders-text";
import { card, ghostButton, sectionTitle } from "./order-detail-parts";

type Shown = DetailQuote["status"] | "expired";

const STATUS_STYLE: Record<Shown, string> = {
  draft: "bg-line-soft text-foreground",
  sent: "bg-foreground text-background",
  accepted: "bg-success-surface text-success-foreground",
  rejected: "bg-danger-surface text-danger-foreground",
  superseded: "bg-line-soft text-muted",
  expired: "bg-warn-surface text-foreground",
};

/** Un orçamento enviado cuya validez ya pasó se muestra caducado (RF-45): la base no guarda ese estado (P9). */
function shownStatus(quote: DetailQuote, today: string): Shown {
  return quote.status === "sent" && quote.validUntil !== null && quote.validUntil < today ? "expired" : quote.status;
}

/**
 * Pestaña Orçamentos: las versiones del orçamento del pedido, de la más reciente a la más antigua, y el acceso al
 * editor. Si el cliente envió un inventario nuevo después del último orçamento, se avisa de que hay que recalcular
 * (decisión 2 del paso 5).
 */
export function OrderQuotesTab({ lang, t, order, today }: { lang: Locale; t: OrdersText; order: OrderDetail; today: string }) {
  const d = t.detail.quotes;
  const editorHref = localePath(lang, ROUTES.orders.quote(order.id));
  const latest = order.quotes[0] ?? null;
  const hasDraft = latest?.status === "draft";
  const won = order.stage === "won";
  const outdated =
    order.inventory !== null && latest !== null && !hasDraft && latest.status !== "accepted" && latest.inventoryVersion < order.inventory.version;

  if (order.quotes.length === 0) {
    return (
      <div role="status" className={`${card} items-center gap-3 px-6 py-10 text-center`}>
        <svg aria-hidden="true" width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r="36" className="fill-primary" />
          <circle cx="44" cy="44" r="16" className="fill-on-ink" />
          <circle cx="44" cy="44" r="9" className="fill-sidebar" />
          <path d="M70 60 L86 68 L82 74 L66 66 Z" className="fill-primary" />
        </svg>
        <h2 className={sectionTitle}>{d.emptyTitle}</h2>
        <p className="max-w-105 text-[15px] text-muted">{order.inventory ? d.emptyReady : d.emptyWaiting}</p>
        {order.inventory ? (
          <Link href={editorHref} className={`${ghostButton} h-10 px-4 text-sm`}>
            {d.create}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <section aria-labelledby="quotes-title" className={`${card} gap-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="quotes-title" className={sectionTitle}>
          {t.detail.tabs.quotes}
        </h2>
        {won ? null : (
          <Link href={editorHref} className={`${ghostButton} h-10 px-4 text-sm`}>
            {hasDraft ? d.continueDraft : d.newVersion}
          </Link>
        )}
      </div>

      {outdated && order.inventory ? (
        <p role="status" className="rounded-xl bg-warn-surface px-4 py-3 text-sm font-bold">
          {interpolate(d.outdated, { version: order.inventory.version })}
        </p>
      ) : null}

      <ul className="flex flex-col gap-2.5">
        {order.quotes.map((quote) => {
          const status = shownStatus(quote, today);
          return (
            <li key={quote.version} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line-soft px-4 py-3">
              <span className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
                <strong className="text-[15px]">{interpolate(d.number, { number: String(quote.number).padStart(4, "0"), version: quote.version })}</strong>
                <span className="text-[13px] text-muted">
                  {[
                    quote.sentAt ? interpolate(d.sentOn, { date: formatDate(quote.sentAt) }) : null,
                    quote.acceptedAt
                      ? interpolate(d.acceptedOn, { date: formatDate(quote.acceptedAt) })
                      : quote.validUntil && quote.status === "sent"
                        ? interpolate(d.validUntil, { date: formatDate(quote.validUntil) })
                        : null,
                    interpolate(d.inventoryOf, { version: quote.inventoryVersion }),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {quote.status === "rejected" && quote.rejectedReason ? (
                  <span className="text-[13px]">{interpolate(d.rejected, { reason: quote.rejectedReason })}</span>
                ) : null}
              </span>
              <span className="text-[15px] font-bold">{interpolate(d.total, { amount: formatEuro(quote.totalCents) })}</span>
              <span className={`inline-flex h-6.5 items-center rounded-full px-2.5 text-xs font-bold ${STATUS_STYLE[status]}`}>{d.statuses[status]}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
