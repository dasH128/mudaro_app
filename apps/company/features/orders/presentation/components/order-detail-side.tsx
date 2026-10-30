import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDate, formatDateTime, formatPhone } from "@/app/lib/format";
import { firstName } from "../../domain/client-name";
import type { DetailLink, DetailNote, LinkState, OrderDetail } from "../../domain/detail";
import type { OrdersText } from "../orders-text";
import { card } from "./order-detail-parts";

const panel = `${card} gap-4 p-5.5`;
const panelTitle = "font-display text-xl font-extrabold";
const pill = "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-field-border text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Datos del cliente y atajos para llamarle o escribirle. */
export function ClientPanel({ t, client }: { t: OrdersText; client: OrderDetail["client"] }) {
  const d = t.detail.side;
  const whatsapp = client.phone ? `https://wa.me/${client.phone.replace("+", "")}` : null;

  return (
    <section aria-labelledby="client" className={panel}>
      <div className="flex items-center justify-between gap-2.5">
        <h2 id="client" className={panelTitle}>
          {d.client}
        </h2>
        {/* TODO: la ficha de cliente aún no existe (Clientes sigue pendiente) */}
        <button type="button" disabled title={t.list.soon} className="text-[13px] font-bold underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50">
          {d.viewFile}
        </button>
      </div>
      <ul className="flex flex-col gap-2.5 text-sm">
        <li className="flex items-center gap-2.5">
          <Icon name="team" size={18} className="text-muted" />
          {client.name} · {t.new.client.types[client.type]}
        </li>
        {client.phone ? (
          <li className="flex items-center gap-2.5">
            <Icon name="smartphone" size={18} className="text-muted" />
            {formatPhone(client.phone)}
          </li>
        ) : null}
        {client.email ? (
          <li className="flex items-center gap-2.5 break-all">
            <Icon name="mail" size={18} className="text-muted" />
            {client.email}
          </li>
        ) : null}
        {!client.phone && !client.email ? <li className="text-muted">{d.noContact}</li> : null}
      </ul>
      <div className="grid grid-cols-2 gap-2">
        {client.phone && whatsapp ? (
          <>
            <a href={`tel:${client.phone}`} className={pill}>
              <Icon name="phone" size={16} />
              {d.call}
            </a>
            <a href={whatsapp} target="_blank" rel="noreferrer" className={pill}>
              <Icon name="message" size={16} />
              {d.whatsapp}
            </a>
          </>
        ) : null}
      </div>
    </section>
  );
}

/** Estado del enlace del cliente. El enlace en sí aún no se genera (RF-15), por eso copiar y ver como cliente van desactivados. */
export function LinkPanel({
  lang,
  t,
  clientName,
  link,
  state,
}: {
  lang: Locale;
  t: OrdersText;
  clientName: string;
  link: DetailLink;
  state: LinkState;
}) {
  const d = t.detail.side;
  const name = firstName(clientName);
  const status = {
    active: "bg-success-surface text-success-foreground",
    expired: "bg-danger-surface text-danger-foreground",
    closed: "bg-line-soft text-muted",
  }[state.status];
  const dot = { active: "bg-success-dot", expired: "bg-danger-dot", closed: "bg-muted" }[state.status];
  const text =
    state.status === "active"
      ? `${pluralize(lang, state.daysLeft, d.daysLeft)} ${interpolate(d.canEdit, { name })}`
      : state.status === "expired"
        ? interpolate(d.expiredText, { name })
        : d.closedText;

  return (
    <section aria-labelledby="link" className={`${panel} gap-3.5`}>
      <div className="flex items-center justify-between gap-2.5">
        <h2 id="link" className={panelTitle}>
          {d.link}
        </h2>
        <span className={`inline-flex h-6.5 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold ${status}`}>
          <span className={`size-1.75 rounded-full ${dot}`} />
          {d.linkStatus[state.status]}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[13px]">
          <span className="text-muted">{d.validUntil}</span>
          <strong>{formatDate(link.validUntil)}</strong>
        </div>
        <div
          role="img"
          aria-label={interpolate(d.usedOf, { used: state.daysUsed, total: link.validityDays })}
          className="h-2 overflow-hidden rounded-full bg-line-soft"
        >
          <span className="block h-full rounded-full bg-foreground" style={{ width: `${Math.round(state.usedRatio * 100)}%` }} />
        </div>
        <span className="text-[13px] text-muted">{text}</span>
      </div>
      {/* TODO(supabase): copiar y ver como cliente dependen de generar el enlace con token (RF-15, RNF-02) */}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled title={t.list.soon} className={`${pill} bg-surface disabled:cursor-not-allowed disabled:opacity-50`}>
          {d.copy}
        </button>
        <button type="button" disabled title={t.list.soon} className={`${pill} bg-surface disabled:cursor-not-allowed disabled:opacity-50`}>
          {d.viewAsClient}
        </button>
      </div>
    </section>
  );
}

/** Notas que solo ve la equipa. */
export function NotesPanel({ t, note }: { t: OrdersText; note: DetailNote | null }) {
  const d = t.detail.side;
  return (
    <section aria-labelledby="notes" className="flex flex-col gap-2.5 rounded-[20px] border border-accent bg-status-config-surface p-5.5">
      <h2 id="notes" className={`${panelTitle} flex items-center gap-2`}>
        <Icon name="pencil" size={18} />
        {d.notes}
      </h2>
      <label htmlFor="note" className="sr-only">
        {d.noteLabel}
      </label>
      {/* TODO(supabase): guardar la nota con una Server Action; de momento se muestra sin poder editarla */}
      <textarea
        id="note"
        rows={4}
        readOnly
        defaultValue={note?.text ?? ""}
        placeholder={d.notePlaceholder}
        className="resize-y rounded-[14px] border border-accent bg-surface-soft px-3.5 py-3 text-sm leading-normal text-foreground placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      />
      {note ? <span className="text-xs text-muted">{interpolate(d.noteMeta, { author: note.author, when: formatDateTime(note.at) })}</span> : null}
    </section>
  );
}
