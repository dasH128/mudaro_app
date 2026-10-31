import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import { CopyButton } from "@/app/components/copy-button";
import { PanelEscape } from "@/app/components/panel-escape";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDayMonth, formatDayMonthShort, formatEuroWhole, formatMonthYear, formatPhone } from "@/app/lib/format";
import { ROUTES, localePath } from "@/app/lib/routes";
import { acceptedTotal, doneCount, lacksTaxId } from "../../domain/clients";
import type { AddressUse, Client } from "../../domain/types";
import { describeOrderNote, lostMonth, type ClientsText } from "../clients-text";
import { ClientAvatar, StageBadge, TypeTag, focusRing } from "./clients-parts";

type Props = {
  lang: Locale;
  t: ClientsText;
  client: Client;
  today: string;
  /** Posición 1..total entre los clientes visibles, para "Cliente 3 de 16". */
  position: number;
  total: number;
  previousHref: string;
  nextHref: string;
  closeHref: string;
  /** Los importes aceptados solo los ve el administrador (RNF-03). */
  showValues: boolean;
};

const iconButton = "grid size-9 place-items-center rounded-full text-foreground " + focusRing;
const statBox = "flex flex-col gap-0.5 rounded-[14px] bg-surface-head p-3";
const statValue = "font-display text-[22px] font-bold";
const label = "flex flex-col gap-1 text-[13px] font-bold";
const heading = "text-base font-bold";
const readonlyBox = "h-10.5 min-w-0 rounded-xl border border-field-border bg-transparent px-3 text-[15px] font-normal text-foreground outline-none";
const soonButton = `cursor-not-allowed text-[13px] font-bold underline opacity-60 ${focusRing}`;

function addressMeta(use: AddressUse, t: ClientsText, lang: Locale): string {
  const a = t.panel.addresses;
  switch (use.kind) {
    case "orders":
      return pluralize(lang, use.count, a.orders);
    case "origin":
      return a.origin;
    case "destination":
      return a.destination;
    case "see-order":
      return a.seeOrder;
  }
}

/** Panel lateral del cliente (P9): resumen, pedidos, datos, direcciones y privacidad. */
export function ClientPanel({ lang, t, client, today, position, total, previousHref, nextHref, closeHref, showValues }: Props) {
  const p = t.panel;
  const accepted = acceptedTotal(client);
  const taxIdMissing = lacksTaxId(client);
  const dup = client.duplicate;

  return (
    <aside
      aria-labelledby="client-panel-title"
      className="sticky top-6 flex max-h-[calc(100vh-3rem)] min-w-80 flex-[0_1_420px] flex-col overflow-y-auto rounded-3xl border border-line bg-surface shadow-[0_16px_40px_rgba(27,31,59,0.12)]"
    >
      <PanelEscape href={closeHref} />

      <div className="sticky top-0 z-1 flex items-center justify-between gap-2 rounded-t-3xl border-b border-line-soft bg-surface px-4 py-3.5">
        <span className="flex items-center gap-1.5">
          <Link href={previousHref} scroll={false} aria-label={p.previous} className={`${iconButton} border border-status-off-border`}>
            <Icon name="chevronLeft" size={16} strokeWidth={2.4} />
          </Link>
          <Link href={nextHref} scroll={false} aria-label={p.next} className={`${iconButton} border border-status-off-border`}>
            <Icon name="chevronRight" size={16} strokeWidth={2.4} />
          </Link>
          <span className="text-[13px] text-muted">{interpolate(p.position, { position, total })}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-xs text-muted">{p.escHint}</span>
          <Link href={closeHref} scroll={false} aria-label={p.close} className={`${iconButton} bg-surface-head`}>
            <Icon name="close" size={16} strokeWidth={2.4} />
          </Link>
        </span>
      </div>

      <div className="flex flex-col gap-5.5 p-5.5">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3.5">
            <ClientAvatar id={client.id} name={client.name} type={client.type} size={60} />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h2 id="client-panel-title" className="font-display text-[26px] leading-[1.1] font-extrabold">
                {client.name}
              </h2>
              <span className="flex flex-wrap items-center gap-1.5">
                <TypeTag type={client.type} label={t.types[client.type]} />
                <span className="text-[13px] text-muted">{interpolate(p.since, { date: formatMonthYear(lang, client.sinceOn) })}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={localePath(lang, ROUTES.orders.new)}
              className={`inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-bold text-background ${focusRing}`}
            >
              <Icon name="plus" size={16} strokeWidth={2.5} />
              {p.newOrder}
            </Link>
            <CopyButton text={formatPhone(client.phone)} label={p.copyPhone} copiedLabel={p.copied} />
          </div>
        </div>

        {dup ? (
          <section aria-labelledby="client-duplicate" className="flex flex-col gap-2.5 rounded-[18px] border border-dashed border-accent bg-surface-soft p-4">
            <h3 id="client-duplicate" className="text-[15px] font-bold">
              {p.duplicate.title}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[13px]">
              <span className="flex flex-col gap-0.5 rounded-xl border-2 border-foreground bg-surface px-3 py-2.5">
                <strong>{client.name}</strong>
                <span className="text-muted">
                  {formatPhone(client.phone)} · {client.email ? p.duplicate.withEmail : p.duplicate.withoutEmail}
                </span>
                <span className="text-muted">{client.orders[0] ? `${client.orders[0].id} · ${formatDayMonth(client.orders[0].moveOn)}` : null}</span>
              </span>
              <span className="flex flex-col gap-0.5 rounded-xl border border-line bg-surface px-3 py-2.5">
                <strong>{dup.name}</strong>
                <span className="text-muted">
                  {formatPhone(dup.phone)} · {dup.hasEmail ? p.duplicate.withEmail : p.duplicate.withoutEmail}
                </span>
                <span className="text-muted">{interpolate(p.duplicate.lostIn, { orderId: dup.orderId, month: lostMonth(dup.lostOn, lang) })}</span>
              </span>
            </div>
            <span className="text-xs text-muted">{interpolate(p.duplicate.keep, { name: client.name })}</span>
            {/* Juntar fichas aún no tiene flujo: los botones salen desactivados */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled
                title={t.soon}
                className={`h-9.5 cursor-not-allowed rounded-full bg-foreground px-4 text-[13px] font-bold text-background opacity-60 ${focusRing}`}
              >
                {p.duplicate.merge}
              </button>
              <button type="button" disabled title={t.soon} className={`px-2.5 ${soonButton}`}>
                {p.duplicate.different}
              </button>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="client-stats" className="grid grid-cols-3 gap-2">
          <h3 id="client-stats" className="sr-only">
            {p.stats.label}
          </h3>
          <span className={statBox}>
            <strong className={statValue}>{client.orders.length}</strong>
            <span className="text-xs text-muted">{p.stats.orders}</span>
          </span>
          <span className={statBox}>
            <strong className={statValue}>{doneCount(client)}</strong>
            <span className="text-xs text-muted">{p.stats.done}</span>
          </span>
          {showValues ? (
            <span className="flex flex-col gap-0.5 rounded-[14px] bg-success-surface p-3 text-success-foreground">
              <strong className={statValue}>{accepted === null ? "—" : formatEuroWhole(accepted)}</strong>
              <span className="text-xs">{p.stats.accepted}</span>
            </span>
          ) : null}
        </section>

        <section aria-labelledby="client-orders" className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id="client-orders" className={heading}>
              {p.orders.title}
            </h3>
            <Link href={localePath(lang, ROUTES.orders.list)} className={`text-[13px] font-bold text-foreground underline ${focusRing}`}>
              {p.orders.viewAll}
            </Link>
          </div>
          <ol className="flex flex-col gap-2">
            {client.orders.map((order) => {
              const when = formatDayMonthShort(lang, order.moveOn);
              return (
                <li key={order.id} className="flex gap-3 rounded-[14px] border border-line-soft p-3">
                  <span
                    className={`flex h-12.5 w-11.5 flex-none flex-col items-center justify-center gap-0.5 rounded-xl ${order.stage === "in-progress" ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}
                  >
                    <span className="font-display text-[17px] leading-none font-extrabold">{when.day}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.06em]">{when.month}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                    <span className="flex flex-wrap items-center justify-between gap-1.5">
                      <Link href={localePath(lang, ROUTES.orders.detail(order.id))} className={`font-bold text-foreground underline ${focusRing}`}>
                        {order.id} · {order.route}
                      </Link>
                      <StageBadge stage={order.stage} label={t.stages[order.stage]} />
                    </span>
                    <span className="text-xs text-muted">{describeOrderNote(order, client, t, lang, today)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="client-data" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id="client-data" className={heading}>
              {p.data.title}
            </h3>
            <span className="text-xs text-muted">{p.data.readOnly}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <label className={`${label} col-span-2`}>
              {p.data.name}
              <input readOnly value={client.name} className={readonlyBox} />
            </label>
            <label className={label}>
              {p.data.phone}
              <input readOnly value={formatPhone(client.phone)} className={readonlyBox} />
            </label>
            <label className={label}>
              {p.data.email}
              <input readOnly value={client.email ?? ""} placeholder={p.data.emailPlaceholder} className={`${readonlyBox} placeholder:text-field-placeholder`} />
            </label>
            <label className={label}>
              {p.data.type}
              <input readOnly value={t.types[client.type]} className={readonlyBox} />
            </label>
            <label className={label}>
              {p.data.taxId}
              <input
                readOnly
                value={client.taxId ?? ""}
                placeholder={p.data.taxIdPlaceholder}
                className={`${readonlyBox} placeholder:text-field-placeholder ${taxIdMissing ? "border-2 border-warn-border bg-warn-surface" : ""}`}
              />
            </label>
          </div>
          {taxIdMissing ? <span className="text-[13px] font-bold text-warn-foreground">{p.data.taxIdMissing}</span> : null}
          {client.email === null ? <span className="text-[13px] text-muted">{p.data.emailMissing}</span> : null}
        </section>

        <section aria-labelledby="client-addresses" className="flex flex-col gap-2">
          <h3 id="client-addresses" className={heading}>
            {p.addresses.title}
          </h3>
          {client.addresses.map((address) => (
            <span key={address.text} className="flex items-center gap-2.5 rounded-xl bg-surface-soft px-3 py-2.5 text-[13px]">
              <Icon name="pin" size={16} strokeWidth={2.2} className="flex-none text-primary" />
              <span className="flex-1">{address.text}</span>
              <span className="text-muted">{addressMeta(address.use, t, lang)}</span>
            </span>
          ))}
        </section>

        <section aria-labelledby="client-privacy" className="flex flex-col gap-2 border-t border-line-soft pt-3.5">
          <h3 id="client-privacy" className="text-[15px] font-bold">
            {p.privacy.title}
          </h3>
          <p className="text-xs leading-snug text-muted">{p.privacy.text}</p>
          {/* Exportar y anonimizar aún no tienen flujo: salen desactivados */}
          <div className="flex flex-wrap gap-3.5">
            <button type="button" disabled title={t.soon} className={soonButton}>
              {p.privacy.export}
            </button>
            <button type="button" disabled title={t.soon} className={`${soonButton} text-danger-foreground`}>
              {p.privacy.anonymize}
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
