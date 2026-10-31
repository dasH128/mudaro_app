import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import { PanelEscape } from "@/app/components/panel-escape";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDayMonthShort, formatInteger, formatPhone, formatWeekdayDay } from "@/app/lib/format";
import { addDays } from "@/features/fleet/domain/fleet";
import { stateOf } from "../../domain/team";
import type { Invite, Member, Person } from "../../domain/types";
import { describeAccess, describeEvent, describeInviteTimes, describeRole, describeStatus, positionLabel, type TeamText } from "../team-text";
import { PersonAvatar, StatusPill, focusRing } from "./team-parts";

type Props = {
  lang: Locale;
  t: TeamText;
  person: Person;
  today: string;
  /** Posición 1..total entre las personas visibles, para "Pessoa 3 de 11". */
  position: number;
  total: number;
  previousHref: string;
  nextHref: string;
  closeHref: string;
};

/** Horas de un día completo en la barra del gráfico semanal. */
const FULL_DAY_HOURS = 10;

const iconButton = "grid size-9 place-items-center rounded-full text-foreground " + focusRing;
const statBox = "flex flex-col gap-0.5 rounded-[14px] bg-surface-head p-3";
const statValue = "font-display text-[22px] font-bold";
const label = "flex flex-col gap-1 text-[13px] font-bold";
const heading = "text-base font-bold";
const readonlyBox = "h-10.5 rounded-xl border border-field-border bg-transparent px-3 text-[15px] font-normal text-foreground outline-none";
const secondaryButton =
  "h-10 cursor-not-allowed rounded-full border border-field-border bg-surface px-4 text-sm font-bold text-foreground opacity-60 " + focusRing;

/** Convite por aceitar: enlace, reenviar, regenerar y cancelar. Nada de esto tiene flujo todavía, sale desactivado. */
function InviteSection({ t, invite, today }: { t: TeamText; invite: Invite; today: string }) {
  const p = t.panel.invite;
  const { sent, expires } = describeInviteTimes(invite, t, today);

  return (
    <section aria-labelledby="person-invite" className="flex flex-col gap-3.5 rounded-[20px] bg-info-surface p-4.5">
      <div className="flex flex-col gap-1">
        <h3 id="person-invite" className={heading}>
          {p.title}
        </h3>
        <span className="text-[13px]">
          {interpolate(p.meta, { sent, expires, position: positionLabel(invite.position, t).toLowerCase() })}
        </span>
      </div>
      <div className="flex h-11 items-center gap-2 rounded-full border border-field-border bg-surface pr-1.5 pl-3.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-muted">{p.linkPlaceholder}</span>
        <button
          type="button"
          disabled
          title={t.soon}
          className={`h-8.5 cursor-not-allowed rounded-full bg-foreground px-3.5 text-[13px] font-bold text-background opacity-60 ${focusRing}`}
        >
          {p.copy}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled title={t.soon} className={secondaryButton}>
          {p.resend}
        </button>
        <button type="button" disabled title={t.soon} className={secondaryButton}>
          {p.regenerate}
        </button>
      </div>
      <p className="text-xs leading-snug text-muted">{p.note}</p>
      <button
        type="button"
        disabled
        title={t.soon}
        className={`w-fit cursor-not-allowed text-[13px] font-bold text-danger-foreground underline opacity-60 ${focusRing}`}
      >
        {p.cancel}
      </button>
    </section>
  );
}

function MemberSections({ lang, t, member, today }: { lang: Locale; t: TeamText; member: Member; today: string }) {
  const p = t.panel;
  const week = member.weekHours.map((hours, index) => ({ hours, day: formatWeekdayDay(lang, addDays(today, index)) }));
  const busyDays = week.filter((d) => d.hours > 0).length;
  const busyHours = week.reduce((sum, d) => sum + d.hours, 0);
  const missingPhone = member.phone === null;

  return (
    <>
      <section aria-labelledby="person-week" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 id="person-week" className={heading}>
            {p.week.title}
          </h3>
          <span className="text-[13px] text-muted">
            {busyDays === 0 ? p.week.allFree : pluralize(lang, busyDays, p.week.summary, { hours: formatInteger(busyHours) })}
          </span>
        </div>
        <div
          role="img"
          aria-label={interpolate(p.week.aria, {
            days: week.map((d) => (d.hours ? interpolate(p.week.dayAria, { day: d.day, hours: d.hours }) : `${d.day} ${p.week.free}`)).join(", "),
          })}
          className="grid grid-cols-7 gap-1.5"
        >
          {week.map((d, index) => (
            <span key={d.day} className="flex flex-col items-center gap-1.5">
              <span className="flex h-14 w-full items-end overflow-hidden rounded-[10px] bg-surface-soft">
                <span
                  className={`block w-full rounded-t-lg ${index === 0 ? "bg-primary" : "bg-foreground"}`}
                  style={{ height: `${Math.min(d.hours / FULL_DAY_HOURS, 1) * 100}%` }}
                />
              </span>
              <span className={`whitespace-nowrap text-[11px] font-bold ${index === 0 ? "text-foreground" : "text-muted"}`}>{d.day}</span>
              <span className="text-[11px] text-muted">{d.hours ? interpolate(p.week.hours, { hours: d.hours }) : p.week.free}</span>
            </span>
          ))}
        </div>
      </section>

      <section aria-labelledby="person-jobs" className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 id="person-jobs" className={heading}>
            {p.jobs.title}
          </h3>
          {/* La agenda aún no existe */}
          <span title={t.soon} className="cursor-not-allowed text-[13px] font-bold opacity-50">
            {p.jobs.viewSchedule}
          </span>
        </div>
        {member.jobs.length === 0 ? (
          <p className="rounded-[14px] bg-surface-soft p-3.5 text-sm text-muted">{p.jobs.none}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {member.jobs.map((job) => {
              const isToday = job.date === today;
              const when = formatDayMonthShort(lang, job.date);
              return (
                <li key={job.orderId} className="flex gap-3 rounded-[14px] border border-line-soft p-3">
                  <span
                    className={`flex h-12.5 w-11.5 flex-none flex-col items-center justify-center gap-0.5 rounded-xl ${isToday ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}
                  >
                    <span className="font-display text-[17px] leading-none font-extrabold">{when.day}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.06em]">{when.month}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
                    <span className="flex justify-between gap-2">
                      <span className="font-bold">{job.client}</span>
                      <span className="whitespace-nowrap text-xs text-muted">
                        {job.start}–{job.end}
                      </span>
                    </span>
                    <span className="text-[13px] text-muted">
                      {job.orderId} · {job.vehicle}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="person-month" className="flex flex-col gap-2.5">
        <h3 id="person-month" className={heading}>
          {p.month.title}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <span className={statBox}>
            <strong className={statValue}>{member.stats30d.jobs}</strong>
            <span className="text-xs text-muted">{p.month.jobs}</span>
          </span>
          <span className={statBox}>
            <strong className={statValue}>{member.stats30d.hours}</strong>
            <span className="text-xs text-muted">{p.month.hours}</span>
          </span>
          <span className={statBox}>
            <strong className={statValue}>{member.stats30d.incidents}</strong>
            <span className="text-xs text-muted">{p.month.incidents}</span>
          </span>
        </div>
      </section>

      <section aria-labelledby="person-data" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 id="person-data" className={heading}>
            {p.data.title}
          </h3>
          <span className="text-xs text-muted">{p.data.readOnly}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <label className={label}>
            {p.data.phone}
            <input
              readOnly
              value={member.phone ? formatPhone(member.phone) : ""}
              placeholder={p.data.phonePlaceholder}
              className={`${readonlyBox} ${missingPhone ? "border-2 border-warn-border bg-warn-surface" : ""}`}
            />
          </label>
          <label className={label}>
            {p.data.position}
            <input readOnly value={positionLabel(member.position, t)} className={readonlyBox} />
          </label>
          <label className={`${label} col-span-2`}>
            {p.data.role}
            <input readOnly value={p.data.roleOperator} className={readonlyBox} />
          </label>
        </div>
        {missingPhone ? <span className="text-[13px] font-bold text-warn-foreground">{p.data.phoneMissing}</span> : null}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-surface-soft px-3.5 py-3 text-[13px]">
          <span className="text-muted">
            {p.data.lastAccess} <strong className="text-foreground">{describeAccess(member.lastAccess, t, lang, today)}</strong>
          </span>
          <span title={t.soon} className="cursor-not-allowed font-bold opacity-50">
            {p.data.sendLink}
          </span>
        </div>
      </section>
    </>
  );
}

/** Panel lateral de la persona (P8): estado, semana, trabajos, números, datos y histórico; o el convite pendiente. */
export function PersonPanel({ lang, t, person, today, position, total, previousHref, nextHref, closeHref }: Props) {
  const p = t.panel;
  const state = stateOf(person);
  const status = describeStatus(person, t, today);
  const member = person.kind === "member" ? person : null;
  const warnJobs = member && !member.active && member.jobs.length > 0 ? member.jobs.length : 0;

  return (
    <aside
      aria-labelledby="person-panel-title"
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
            <PersonAvatar person={person} size={60} />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h2 id="person-panel-title" className="font-display text-[26px] leading-[1.1] font-extrabold">
                {person.name}
              </h2>
              <span className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-6 items-center rounded-full bg-status-config-surface px-2.5 text-xs font-bold">
                  {t.operatorBadge}
                </span>
                <span className="text-[13px] text-muted">{describeRole(person, t)}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] ${
                member && member.phone === null ? "border border-warn-border bg-warn-surface font-bold text-warn-foreground" : "bg-surface-head"
              }`}
            >
              <Icon name="smartphone" size={14} strokeWidth={2.2} />
              {person.phone ? formatPhone(person.phone) : p.noPhone}
            </span>
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-head px-3 text-[13px]">
              <Icon name="mail" size={14} strokeWidth={2.2} />
              {person.email}
            </span>
          </div>

          {member ? (
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-surface-soft px-3.5 py-3">
              <span className="flex flex-wrap items-center gap-2">
                <StatusPill state={state} label={status.label} />
                <span className="text-[13px] text-muted">{status.note}</span>
              </span>
              {/* Activar y desactivar aún no se guarda: el interruptor sale desactivado */}
              <button
                type="button"
                role="switch"
                aria-checked={member.active}
                aria-label={interpolate(member.active ? p.deactivate : p.activate, { name: member.name })}
                disabled
                title={t.soon}
                className={`inline-flex h-9 cursor-not-allowed items-center gap-2.5 pr-0.5 pl-2 text-[13px] font-bold text-foreground opacity-60 ${focusRing}`}
              >
                {member.active ? p.on : p.off}
                <span className={`relative h-7 w-11.5 flex-none rounded-full ${member.active ? "bg-foreground" : "bg-status-off-border"}`}>
                  <span
                    className={`absolute top-1 size-5 rounded-full ${member.active ? "left-5.5 bg-background" : "left-1 bg-surface"}`}
                  />
                </span>
              </button>
            </div>
          ) : null}

          {warnJobs > 0 ? (
            <div className="flex gap-2.5 rounded-[14px] border border-warn-border bg-warn-surface px-3.5 py-3 text-[13px] leading-snug text-warn-foreground">
              <Icon name="info" size={18} className="flex-none" />
              <span>{pluralize(lang, warnJobs, p.pendingJobs)}</span>
            </div>
          ) : null}
        </div>

        {person.kind === "invite" ? <InviteSection t={t} invite={person} today={today} /> : null}
        {member ? <MemberSections lang={lang} t={t} member={member} today={today} /> : null}

        <section aria-labelledby="person-history" className="flex flex-col gap-2.5">
          <h3 id="person-history" className={heading}>
            {p.history.title}
          </h3>
          <ol className="flex flex-col gap-2.5">
            {person.history.map((event) => {
              const text = describeEvent(event, t);
              return (
                <li key={`${event.kind}-${event.at}`} className="flex gap-2.5 text-[13px]">
                  <span aria-hidden className="mt-1.5 size-2 flex-none rounded-full bg-accent" />
                  <span className="flex flex-col">
                    <strong>{text.title}</strong>
                    <span className="text-muted">{text.meta}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </aside>
  );
}
