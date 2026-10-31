import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatInteger } from "@/app/lib/format";
import { daysToExpire, isIdle, lacksPhone, stateOf } from "../../domain/team";
import type { Person } from "../../domain/types";
import { teamHref, type TeamParams } from "../team-href";
import {
  describeInactive,
  describeLastWork,
  describeNextWork,
  describeRole,
  describeStatus,
  type TeamText,
} from "../team-text";
import { IssueBadge, PersonAvatar, StatusPill, focusRing } from "./team-parts";

type Props = {
  lang: Locale;
  t: TeamText;
  active: Person[];
  inactive: Person[];
  selectedId: string | undefined;
  /** Filtros actuales, para conservarlos en los enlaces de cada fila. */
  params: Omit<TeamParams, "person">;
  today: string;
  /** Con el panel abierto se ocultan "Último trabalho" y "Próximo trabalho" para dar sitio. */
  compact: boolean;
  /** Mensaje cuando no hay nadie (búsqueda o filtro sin resultados). */
  emptyMessage: string;
};

// Plantillas de columnas (estáticas para que Tailwind las genere)
const COLS_FULL = "grid-cols-[minmax(250px,1.7fr)_minmax(210px,1.3fr)_minmax(140px,0.8fr)_minmax(170px,1.1fr)_minmax(130px,0.8fr)_44px]";
const COLS_COMPACT = "grid-cols-[minmax(230px,1.5fr)_minmax(200px,1.2fr)_minmax(165px,0.9fr)_44px]";

const cell = "flex min-w-0 flex-col gap-1 px-2.5";

type RowProps = Omit<Props, "active" | "inactive" | "emptyMessage"> & { person: Person };

function PersonRow({ lang, t, person, selectedId, params, today, compact }: RowProps) {
  const selected = person.id === selectedId;
  const href = teamHref(lang, { ...params, person: person.id });
  const state = stateOf(person);
  const status = describeStatus(person, t, today);
  const member = person.kind === "member" ? person : null;
  const inactive = member && !member.active ? describeInactive(member, t) : null;
  const last = member ? describeLastWork(member, t, lang, today) : { title: "—", sub: t.lastWork.noAccount };
  const next = member ? describeNextWork(member, t, today) : { title: "—", sub: "" };
  const idle = member ? isIdle(member, today) : false;
  const urgent = person.kind === "invite" && daysToExpire(person, today) <= 1;
  const muted = state === "inactive" ? "text-muted" : "";

  return (
    <div
      role="row"
      className={`grid min-h-16 items-center rounded-2xl hover:bg-surface-soft ${compact ? COLS_COMPACT : COLS_FULL} ${selected ? "bg-surface-soft ring-2 ring-inset ring-foreground" : ""}`}
    >
      <div role="cell" className="flex min-w-0 items-center gap-3 px-3 py-2.5">
        <PersonAvatar person={person} size={40} />
        <span className="flex min-w-0 flex-col gap-0.75">
          <Link
            href={href}
            scroll={false}
            aria-label={interpolate(t.table.viewDetail, { name: person.name })}
            className={`w-fit whitespace-nowrap text-[15px] font-bold hover:underline ${state === "inactive" ? "text-muted" : "text-foreground"} ${focusRing}`}
          >
            {person.name}
          </Link>
          <span className="text-xs text-muted">{describeRole(person, t)}</span>
          {member && lacksPhone(member) ? <IssueBadge>{t.phoneMissing}</IssueBadge> : null}
        </span>
      </div>

      <div role="cell" className={cell}>
        <StatusPill state={state} label={inactive ? inactive.reason : status.label} dot={!inactive} />
        <span className={`text-xs ${urgent ? "font-bold text-warn-foreground" : "text-muted"}`}>
          {inactive ? inactive.since : status.note}
        </span>
      </div>

      {compact ? null : (
        <>
          <div role="cell" className={`${cell} ${muted}`}>
            <strong className="whitespace-nowrap text-sm">{last.title}</strong>
            <span className={`truncate text-xs ${idle ? "font-bold text-warn-foreground" : "text-muted"}`}>{last.sub}</span>
          </div>
          <div role="cell" className={`${cell} ${muted}`}>
            <strong className="whitespace-nowrap text-sm">{next.title}</strong>
            <span className="truncate text-xs text-muted">{next.sub}</span>
          </div>
        </>
      )}

      <div role="cell" className={`${cell} gap-0.5`}>
        {member && member.active ? (
          <>
            <span className="text-sm">
              <strong className="font-display text-lg">{formatInteger(member.stats30d.jobs)}</strong>{" "}
              <span className="text-[13px] text-muted">{pluralize(lang, member.stats30d.jobs, t.table.jobsWord)}</span>
            </span>
            <span className="text-xs text-muted">{interpolate(t.table.hoursReal, { hours: formatInteger(member.stats30d.hours) })}</span>
          </>
        ) : person.kind === "invite" ? (
          /* Reenviar aún no tiene flujo: sale desactivado */
          <button
            type="button"
            disabled
            title={t.soon}
            className={`h-8.5 w-fit cursor-not-allowed whitespace-nowrap rounded-full border border-field-border bg-surface px-3.5 text-[13px] font-bold text-foreground opacity-60 ${focusRing}`}
          >
            {t.table.resend}
          </button>
        ) : (
          <span className="text-[13px] text-muted">{t.noAccess}</span>
        )}
      </div>

      <div role="cell">
        <Link
          href={href}
          scroll={false}
          aria-label={interpolate(t.table.open, { name: person.name })}
          className={`mx-1 grid size-9 place-items-center rounded-full ${focusRing} ${selected ? "bg-foreground text-background" : "border border-status-off-border bg-surface text-foreground"}`}
        >
          <Icon name="chevronRight" size={16} strokeWidth={2.4} />
        </Link>
      </div>
    </div>
  );
}

export function TeamTable({ active, inactive, emptyMessage, ...props }: Props) {
  const { t, compact } = props;
  const head = [t.table.person, t.table.status, ...(compact ? [] : [t.table.lastWork, t.table.nextWork]), t.table.jobs30];

  return (
    <section aria-labelledby="team-table" className="overflow-x-auto rounded-3xl border border-line bg-surface px-2 pt-2 pb-3">
      <h2 id="team-table" className="sr-only">
        {t.table.title}
      </h2>
      <div role="table" aria-labelledby="team-table" className={compact ? "min-w-160" : "min-w-245"}>
        <div role="row" className={`mb-1 grid items-center border-b border-line-soft ${compact ? COLS_COMPACT : COLS_FULL}`}>
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

        {active.length === 0 && inactive.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted">{emptyMessage}</p>
        ) : null}
        {active.map((person) => (
          <PersonRow key={person.id} person={person} {...props} />
        ))}

        {inactive.length > 0 ? (
          <details open className="group">
            <summary className="mt-2 flex w-full cursor-pointer list-none items-center gap-2 border-t border-dashed border-line p-3 text-[13px] font-bold text-muted [&::-webkit-details-marker]:hidden">
              <span aria-hidden className="inline-flex transition-transform group-open:rotate-90">
                <Icon name="chevronRight" size={14} strokeWidth={2.4} />
              </span>
              {interpolate(t.table.inactiveTitle, { count: inactive.length })}
              <span className="font-medium">{t.table.inactiveHint}</span>
            </summary>
            {inactive.map((person) => (
              <PersonRow key={person.id} person={person} {...props} />
            ))}
          </details>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 pt-2.5 text-xs text-muted">
        <span>{t.table.footnote}</span>
        {/* La agenda aún no existe */}
        <span title={t.soon} className="cursor-not-allowed font-bold opacity-50">
          {t.table.openSchedule}
        </span>
      </div>
    </section>
  );
}
