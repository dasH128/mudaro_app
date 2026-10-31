import Link from "next/link";

import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatVolume, formatWeekday } from "@/app/lib/format";
import { summarizeInventory, type DetailAddress, type OrderDetail } from "../../domain/detail";
import { accessChips } from "../detail-text";
import { describeWhen, type OrdersText } from "../orders-text";
import { orderDetailHref } from "../orders-href";
import { AddressBadge, card, ghostButton, sectionTitle } from "./order-detail-parts";

type Props = { lang: Locale; t: OrdersText; order: OrderDetail; today: string };

const tile = "flex flex-col gap-1 rounded-[14px] bg-surface-head p-4";
const tileValue = "font-display text-[26px] font-extrabold leading-[1.1]";

function AddressCard({ t, address }: { t: OrdersText; address: DetailAddress }) {
  const s = t.detail.summary;
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-line p-4">
      <span className="flex items-center gap-2.5">
        <AddressBadge role={address.role} />
        <span className="flex flex-col">
          <span className="text-[13px] text-muted">{address.role === "origin" ? s.origin : s.destination}</span>
          <span className="font-bold">{address.place}</span>
        </span>
      </span>
      {address.access ? (
        <span className="flex flex-wrap gap-1.5">
          {accessChips(address.access, t.detail.addresses).map((chip) => (
            <span
              key={chip.label}
              className={`inline-flex h-6.5 items-center rounded-full px-2.5 text-xs font-bold ${
                chip.tone === "warn" ? "border border-warn-border bg-warn-surface text-warn-foreground" : "bg-surface-head text-muted"
              }`}
            >
              {chip.label}
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
}

/** Pestaña Resumo: la mudança, las dos direcciones y lo que pide atención en el inventario. */
export function OrderSummaryTab({ lang, t, order, today }: Props) {
  const s = t.detail.summary;
  const when = describeWhen(order, t.list, lang, today);
  const totals = order.inventory ? summarizeInventory(order.inventory) : null;
  const whenParts = [
    order.flexibility === "month" ? null : formatWeekday(lang, order.date),
    order.flexibility === "exact" ? t.new.move.flexibilities.exact : null,
    when.countdown,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="move" className={`${card} gap-4.5`}>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <h2 id="move" className={sectionTitle}>
            {s.moveTitle}
          </h2>
          {/* TODO: editar la mudança aún no tiene diseño de flujo */}
          <button type="button" disabled title={t.list.soon} className={ghostButton}>
            {s.edit}
          </button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          <div className="flex flex-col gap-1 rounded-2xl bg-sidebar p-4 text-on-ink">
            <span className="text-[13px]">{s.date}</span>
            <span className={tileValue}>{when.date}</span>
            <span className="text-[13px]">{whenParts.join(" · ")}</span>
          </div>
          <div className={tile}>
            <span className="text-[13px] text-muted">{s.volume}</span>
            <span className={tileValue}>{totals ? formatVolume(totals.volumeM3) : "—"}</span>
            <span className="text-[13px] text-muted">
              {totals
                ? interpolate(s.itemsInRooms, { items: pluralize(lang, totals.items, s.items), rooms: pluralize(lang, totals.rooms, s.rooms) })
                : s.noInventory}
            </span>
          </div>
          <div className={tile}>
            <span className="text-[13px] text-muted">{s.distance}</span>
            <span className={tileValue}>{order.distanceKm === null ? "—" : `≈ ${Math.round(order.distanceKm)} km`}</span>
            <span className="text-[13px] text-muted">{order.distanceKm === null ? s.distanceUnknown : s.distanceSub}</span>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
          <AddressCard t={t} address={order.origin} />
          <AddressCard t={t} address={order.destination} />
        </div>
      </section>

      <section aria-labelledby="attention" className={`${card} gap-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <h2 id="attention" className={sectionTitle}>
            {s.attentionTitle}
          </h2>
          {totals ? (
            <Link href={orderDetailHref(lang, order.id, "inventory")} className={ghostButton}>
              {s.viewInventory}
            </Link>
          ) : null}
        </div>

        {order.inventory && totals ? (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
              {[
                { value: totals.missingMeasures, label: s.missing, warn: totals.missingMeasures > 0 },
                { value: totals.fragile, label: s.fragile, warn: false },
                { value: totals.dismantle, label: s.dismantle, warn: false },
                { value: order.inventory.photoCount, label: s.photos, warn: false },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`flex flex-col gap-0.5 rounded-[14px] p-3.5 ${stat.warn ? "bg-warn-surface text-warn-foreground" : "bg-surface-head"}`}
                >
                  <span className="font-display text-2xl font-extrabold">{stat.value}</span>
                  <span className={`text-[13px] ${stat.warn ? "font-bold" : "text-muted"}`}>{stat.label}</span>
                </div>
              ))}
            </div>
            {order.inventory.extras.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold">{s.extras}</span>
                {order.inventory.extras.map((extra) => (
                  <span key={extra} className="inline-flex h-7.5 items-center rounded-full bg-status-config-surface px-3 text-[13px] font-bold">
                    {extra}
                  </span>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted">{s.noAttention}</p>
        )}
      </section>
    </div>
  );
}
