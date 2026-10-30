import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { formatDate } from "@/app/lib/format";
import type { OrderDetail } from "../../domain/detail";
import { actionHref } from "../orders-href";
import type { OrdersText } from "../orders-text";
import { OrderAvatar } from "./order-avatar";
import { OrderStagePill } from "./order-stage-pill";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

type Props = { lang: Locale; t: OrdersText; order: OrderDetail };

/** Cabecera del detalle: cliente, etapa, ruta y la acción principal según la etapa. */
export function OrderDetailHeader({ lang, t, order }: Props) {
  const d = t.detail;
  const meta = [
    order.id,
    <span key="route">
      {order.origin.place.split(",")[0]} <span aria-hidden="true">→</span>
      <span className="sr-only">{t.list.common.routeTo}</span> {order.destination.place.split(",")[0]}
    </span>,
    interpolate(d.meta.createdOn, { date: formatDate(order.createdAt) }),
    order.source ? interpolate(d.meta.source, { source: t.new.move.sources[order.source] }) : null,
  ].filter(Boolean);

  const proposalHref = order.stage === "inventory-received" ? actionHref(lang, "create-proposal", order.id) : null;
  const shareHref =
    order.inventoryMode === "link" && (order.stage === "new" || order.stage === "awaiting-inventory")
      ? actionHref(lang, "share-link", order.id)
      : null;

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div className="flex items-center gap-4">
        <OrderAvatar name={order.client.name} index={1} size="lg" />
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight">
              {interpolate(d.titleLine, { name: order.client.name })}
            </h1>
            <OrderStagePill stage={order.stage} label={t.list.status[order.stage]} />
          </div>
          <p className="text-sm text-muted">
            {meta.map((part, index) => (
              <span key={index}>
                {index > 0 ? " · " : null}
                {part}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* TODO: el menú "Mais ações" aún no tiene acciones definidas */}
        <button
          type="button"
          disabled
          aria-label={d.actions.more}
          title={t.list.soon}
          className={`grid size-12 place-items-center rounded-full border border-field-border bg-surface text-foreground disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}
        >
          <Icon name="moreHorizontal" size={20} />
        </button>
        {proposalHref ? (
          <Link
            href={proposalHref}
            className={`inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-5.5 text-base font-bold text-primary-foreground shadow-[0_6px_16px_color-mix(in_srgb,var(--primary)_28%,transparent)] ${focus}`}
          >
            <Icon name="filePlus" size={18} />
            {d.actions.createProposal}
          </Link>
        ) : null}
        {shareHref ? (
          <Link
            href={shareHref}
            className={`inline-flex h-12 items-center gap-2.5 rounded-full border border-field-border bg-surface px-5.5 text-base font-bold ${focus}`}
          >
            <Icon name="link" size={18} />
            {d.actions.shareLink}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
