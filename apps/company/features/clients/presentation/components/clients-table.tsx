import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatEuroWhole, formatPhone } from "@/app/lib/format";
import { acceptedTotal, doneCount, isReturning } from "../../domain/clients";
import type { Client } from "../../domain/types";
import { clientsHref, type ClientsParams } from "../clients-href";
import { describeLastContact, describeSummary, type ClientsText } from "../clients-text";
import { Badge, ClientAvatar, StageBadge, TypeTag, focusRing } from "./clients-parts";

type Props = {
  lang: Locale;
  t: ClientsText;
  clients: Client[];
  /** Total sin filtrar, para "A mostrar 12 de 16". */
  total: number;
  selectedId: string | undefined;
  /** Filtros actuales, para conservarlos en los enlaces de cada fila. */
  params: Omit<ClientsParams, "client">;
  today: string;
  /** Con el panel abierto se ocultan contacto, importe y último contacto para dar sitio. */
  compact: boolean;
  /** Los importes aceptados solo los ve el administrador (RNF-03). */
  showValues: boolean;
  emptyMessage: string;
};

// Plantillas de columnas (estáticas para que Tailwind las genere)
const COLS_FULL =
  "grid-cols-[minmax(240px,1.5fr)_minmax(170px,1fr)_minmax(230px,1.4fr)_minmax(120px,0.7fr)_minmax(100px,0.6fr)_minmax(150px,0.9fr)_44px]";
const COLS_FULL_NO_VALUES = "grid-cols-[minmax(240px,1.5fr)_minmax(170px,1fr)_minmax(230px,1.4fr)_minmax(120px,0.7fr)_minmax(150px,0.9fr)_44px]";
const COLS_COMPACT = "grid-cols-[minmax(220px,1.4fr)_minmax(200px,1.2fr)_minmax(110px,0.7fr)_44px]";

const cell = "flex min-w-0 flex-col gap-1 px-2.5";

type RowProps = Omit<Props, "clients" | "total" | "emptyMessage"> & { client: Client; columns: string };

function ClientRow({ lang, t, client, selectedId, params, today, compact, showValues, columns }: RowProps) {
  const selected = client.id === selectedId;
  const href = clientsHref(lang, { ...params, client: client.id });
  const accepted = acceptedTotal(client);
  const done = doneCount(client);
  const last = describeLastContact(client, t, lang, today);

  return (
    <div
      role="row"
      className={`grid min-h-16 items-center rounded-2xl hover:bg-surface-soft ${columns} ${selected ? "bg-surface-soft ring-2 ring-inset ring-foreground" : ""}`}
    >
      <div role="cell" className="flex min-w-0 items-center gap-3 px-3 py-2.5">
        <ClientAvatar id={client.id} name={client.name} type={client.type} size={40} />
        <span className="flex min-w-0 flex-col gap-0.75">
          <Link
            href={href}
            scroll={false}
            aria-label={interpolate(t.table.viewDetail, { name: client.name })}
            className={`w-fit max-w-full truncate text-[15px] font-bold text-foreground hover:underline ${focusRing}`}
          >
            {client.name}
          </Link>
          <span className="flex flex-wrap items-center gap-1.5">
            <TypeTag type={client.type} label={t.types[client.type]} />
            {client.duplicate ? <Badge tone="warn">{t.badges.duplicate}</Badge> : null}
            {client.type === "company" && client.taxId === null ? <Badge tone="warn">{t.badges.taxIdMissing}</Badge> : null}
            {isReturning(client) ? <Badge tone="success">{t.badges.returned}</Badge> : null}
          </span>
        </span>
      </div>

      {compact ? null : (
        <div role="cell" className={`${cell} text-[13px]`}>
          <span>{formatPhone(client.phone)}</span>
          <span className={`truncate text-xs ${client.email ? "text-muted" : "text-field-placeholder italic"}`}>{client.email ?? t.noEmail}</span>
        </div>
      )}

      <div role="cell" className={cell}>
        <StageBadge stage={client.stage} label={t.stages[client.stage]} />
        <span className="text-xs text-muted">{describeSummary(client.summary, t, lang, today)}</span>
      </div>

      <div role="cell" className={`${cell} gap-0.5`}>
        <span className="text-sm">
          <strong className="font-display text-lg">{client.orders.length}</strong>{" "}
          <span className="text-[13px] text-muted">{pluralize(lang, client.orders.length, t.table.ordersWord)}</span>
        </span>
        {done > 0 ? <span className="text-xs text-muted">{pluralize(lang, done, t.table.doneCount)}</span> : null}
      </div>

      {compact || !showValues ? null : (
        <div role="cell" className="px-2.5 text-sm font-bold whitespace-nowrap">
          {accepted === null ? "—" : formatEuroWhole(accepted)}
        </div>
      )}

      {compact ? null : (
        <div role="cell" className={cell}>
          <strong className="whitespace-nowrap text-sm">{last.title}</strong>
          <span className="text-xs whitespace-nowrap text-muted">{last.sub}</span>
        </div>
      )}

      <div role="cell">
        <Link
          href={href}
          scroll={false}
          aria-label={interpolate(t.table.open, { name: client.name })}
          className={`mx-1 grid size-9 place-items-center rounded-full ${focusRing} ${selected ? "bg-foreground text-background" : "border border-status-off-border bg-surface text-foreground"}`}
        >
          <Icon name="chevronRight" size={16} strokeWidth={2.4} />
        </Link>
      </div>
    </div>
  );
}

export function ClientsTable({ clients, total, emptyMessage, ...props }: Props) {
  const { t, compact, showValues, lang } = props;
  const columns = compact ? COLS_COMPACT : showValues ? COLS_FULL : COLS_FULL_NO_VALUES;
  const head = compact
    ? [t.table.client, t.table.status, t.table.orders]
    : [t.table.client, t.table.contact, t.table.status, t.table.orders, ...(showValues ? [t.table.accepted] : []), t.table.lastContact];

  return (
    <section aria-labelledby="clients-table" className="min-w-0 flex-[999_1_560px] overflow-x-auto rounded-3xl border border-line bg-surface px-2 pt-2 pb-3">
      <h2 id="clients-table" className="sr-only">
        {t.table.title}
      </h2>
      <div role="table" aria-labelledby="clients-table" className={compact ? "min-w-150" : showValues ? "min-w-265" : "min-w-240"}>
        <div role="row" className={`mb-1 grid items-center border-b border-line-soft ${columns}`}>
          {head.map((label, index) => (
            <span
              key={label}
              role="columnheader"
              className={`whitespace-nowrap px-2.5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted ${index === 0 ? "pl-3" : ""}`}
            >
              {label}
            </span>
          ))}
          <span role="columnheader">
            <span className="sr-only">{t.table.actions}</span>
          </span>
        </div>

        {clients.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">{emptyMessage}</p> : null}
        {clients.map((client) => (
          <ClientRow key={client.id} client={client} columns={columns} {...props} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 pt-2.5 text-xs text-muted">
        <span>{showValues ? t.table.footnote : t.table.footnoteNoValues}</span>
        <span aria-live="polite">{interpolate(t.table.showing, { shown: clients.length, total })}</span>
      </div>
      <span className="sr-only">{pluralize(lang, clients.length, t.resultsCount)}</span>
    </section>
  );
}
