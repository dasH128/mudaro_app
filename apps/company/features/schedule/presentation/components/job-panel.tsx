import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import { CopyButton } from "@/app/components/copy-button";
import { PanelEscape } from "@/app/components/panel-escape";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatCompact, formatCubicMeters, formatDayMonth, formatEuroWhole, formatPhone, formatWeekdayShort } from "@/app/lib/format";
import { ROUTES, localePath } from "@/app/lib/routes";
import { freePeopleOn, jobsOn, missingOf, vehicleOf } from "../../domain/schedule";
import type { Person, ScheduleJob, ScheduleOverview } from "../../domain/types";
import {
  describeAccess,
  describeHistory,
  describeLive,
  describeMoment,
  isHardAccess,
  firstName,
  type PositionsText,
  type ScheduleText,
} from "../schedule-text";
import { JobStatusPill, focusRing, initialsOf } from "./schedule-parts";

type Props = {
  lang: Locale;
  t: ScheduleText;
  positions: PositionsText;
  job: ScheduleJob;
  overview: ScheduleOverview;
  today: string;
  closeHref: string;
};

const iconButton = `grid size-9 place-items-center rounded-full text-foreground ${focusRing}`;
const heading = "text-base font-bold";
const soon = "cursor-not-allowed opacity-60";

type CheckState = "ok" | "bad" | "na";
const CHECK_ICON: Record<CheckState, { symbol: string; look: string }> = {
  ok: { symbol: "✓", look: "bg-success-dot text-white" },
  bad: { symbol: "!", look: "bg-primary text-primary-foreground" },
  na: { symbol: "–", look: "bg-line-soft text-muted" },
};

function pctDelta(est: number, real: number): number {
  return est === 0 ? 0 : Math.round(((real - est) / est) * 100);
}

/** Panel lateral del trabajo (P10): qué falta, cómo va, cierre o resultado, vehículo, equipo, cliente e histórico. */
export function JobPanel({ lang, t, positions, job, overview, today, closeHref }: Props) {
  const p = t.panel;
  const { detail } = job;
  const vehicle = vehicleOf(job, overview.vehicles);
  const crew = job.crewIds.flatMap((id) => overview.people.find((person) => person.id === id) ?? []);
  const missing = missingOf(job);
  const editable = job.status === "scheduled";
  const volume = formatCubicMeters(job.volumeM3);
  const names = (people: readonly Person[]) => people.map((person) => firstName(person.name));

  // Qué falta para salir (solo trabajos programados)
  const checks: { key: string; label: string; value: string; sub: string; state: CheckState }[] = [
    vehicle
      ? {
          key: "vehicle",
          label: p.checks.vehicle,
          value: vehicle.name,
          sub: interpolate(p.checks.vehicleOk, { capacity: vehicle.capacityM3, volume }),
          state: vehicle.capacityM3 >= job.volumeM3 ? "ok" : "bad",
        }
      : { key: "vehicle", label: p.checks.vehicle, value: p.checks.vehicleNone, sub: interpolate(p.checks.vehicleNoneSub, { volume }), state: "bad" },
    {
      key: "crew",
      label: p.checks.crew,
      value: interpolate(p.checks.crewValue, { have: crew.length, need: job.crewNeeded }),
      sub: missing.people === 0 ? p.checks.crewOk : pluralize(lang, missing.people, p.checks.crewMissing),
      state: missing.people === 0 ? "ok" : "bad",
    },
    detail?.permit
      ? { key: "parking", label: p.checks.parking, value: p.checks.permit, sub: interpolate(p.checks.permitSub, { place: detail.permit.place, date: formatDayMonth(detail.permit.grantedOn) }), state: "ok" }
      : { key: "parking", label: p.checks.parking, value: p.checks.noParking, sub: p.checks.noParkingSub, state: "na" },
    { key: "inventory", label: p.checks.inventory, value: p.checks.inventoryValue, sub: p.checks.inventorySub, state: "ok" },
  ];
  const unresolved = checks.filter((check) => check.state === "bad").length;

  // A quién se puede asignar: primero quien está libre ese día
  const free = freePeopleOn(job.date, overview.people, overview.jobs);
  const suggestions = overview.people
    .filter((person) => !job.crewIds.includes(person.id))
    .map((person) => {
      const clash = jobsOn(overview.jobs, job.date).find((other) => other.crewIds.includes(person.id));
      return { person, free: free.some((f) => f.id === person.id), clash };
    })
    .sort((a, b) => Number(b.free) - Number(a.free))
    .slice(0, 4);

  const when = `${formatWeekdayShort(lang, job.date)} ${formatDayMonth(job.date)} · ${job.start}–${job.end}`;
  const tooSmall = vehicle !== undefined && vehicle.capacityM3 < job.volumeM3;
  const leadName = overview.people.find((person) => person.id === detail?.leadId)?.name;
  const ctx = { t, locale: lang, today, people: overview.people };

  return (
    <aside
      aria-labelledby="job-panel-title"
      className="sticky top-6 flex max-h-[calc(100vh-3rem)] min-w-80 flex-[0_1_400px] flex-col overflow-y-auto rounded-3xl border border-line bg-surface shadow-[0_16px_40px_rgba(27,31,59,0.12)]"
    >
      <PanelEscape href={closeHref} />

      <div className="sticky top-0 z-1 flex items-center justify-between gap-2 rounded-t-3xl border-b border-line-soft bg-surface px-4 py-3.5">
        <span className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-bold">{job.id}</span>
          <JobStatusPill status={job.status} label={t.status[job.status]} />
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-xs text-muted">{p.escHint}</span>
          <Link href={closeHref} scroll={false} aria-label={p.closePanel} className={`${iconButton} bg-surface-head`}>
            <Icon name="close" size={16} strokeWidth={2.4} />
          </Link>
        </span>
      </div>

      <div className="flex flex-col gap-5 px-5.5 pt-5 pb-6">
        <div className="flex flex-col gap-2.5">
          <h2 id="job-panel-title" className="font-display text-[26px] leading-[1.1] font-extrabold">
            {job.client}
          </h2>
          <span className="flex flex-wrap gap-1.5">
            <span className="inline-flex h-7.5 items-center gap-1.5 rounded-full bg-surface-head px-3 text-[13px] font-bold">
              <Icon name="calendar" size={14} strokeWidth={2.2} />
              {when}
            </span>
            <span className="inline-flex h-7.5 items-center rounded-full bg-surface-head px-3 text-[13px]">{interpolate(p.volume, { volume })}</span>
          </span>
          <span className="flex items-center gap-2 text-sm text-muted">
            <Icon name="pin" size={16} strokeWidth={2.2} className="flex-none text-primary" />
            {job.from} <span aria-hidden="true">→</span> {job.to}
          </span>
        </div>

        {job.status === "scheduled" ? (
          <section
            aria-labelledby="job-ready"
            className={`flex flex-col gap-3 rounded-[18px] border p-4 ${unresolved ? "border-warn-border bg-warn-surface" : "border-success-border bg-success-surface"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 id="job-ready" className={heading}>
                {unresolved ? p.state.missing : p.state.ready}
              </h3>
              <span
                className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold ${unresolved ? "bg-primary text-primary-foreground" : "bg-success-dot text-white"}`}
              >
                {unresolved ? pluralize(lang, unresolved, p.unresolved) : p.confirmed}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {checks.map((check) => (
                <li key={check.key} className="flex items-start gap-2.5 text-[13px] leading-snug">
                  <span aria-hidden className={`grid size-5.5 flex-none place-items-center rounded-full text-xs font-bold ${CHECK_ICON[check.state].look}`}>
                    {CHECK_ICON[check.state].symbol}
                  </span>
                  <span className="flex flex-1 flex-col">
                    <strong>
                      {check.label} · {check.value}
                    </strong>
                    <span className="text-muted">{check.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {job.status === "in-progress" && detail?.live ? (
          <section aria-labelledby="job-live" className="flex flex-col gap-3 rounded-[18px] border border-primary/40 bg-warn-surface/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 id="job-live" className={heading}>
                {p.live.title}
              </h3>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-warn-foreground">
                <span className="size-2 rounded-full bg-primary" />
                {p.live.tag}
              </span>
            </div>
            <ol className="flex flex-col">
              {detail.live.map((event, index, all) => {
                const text = describeLive(event, { t, locale: lang, vehicle: vehicle?.name ?? "", crew: names(crew) });
                const live = event.at === "now";
                const warn = event.kind === "incident";
                return (
                  <li key={`${event.at}-${event.kind}`} className="flex gap-3">
                    <span className="w-11 flex-none pt-px text-xs font-bold text-muted">{text.time}</span>
                    <span className="flex flex-none flex-col items-center">
                      <span
                        className={`mt-0.75 box-border size-3 rounded-full ${live ? "bg-primary shadow-[0_0_0_4px_var(--warn-surface)]" : warn ? "border-[3px] border-primary bg-surface" : "bg-foreground"}`}
                      />
                      <span className={`min-h-4.5 w-0.5 flex-1 ${index === all.length - 1 ? "bg-transparent" : "bg-line"}`} />
                    </span>
                    <span className="flex flex-col gap-0.5 pb-3 text-[13px]">
                      <strong>{text.label}</strong>
                      {text.sub ? <span className={warn ? "font-bold text-warn-foreground" : "text-muted"}>{text.sub}</span> : null}
                    </span>
                  </li>
                );
              })}
            </ol>
            {leadName ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-primary/25 pt-2.5">
                <span className="text-[13px]">
                  {p.live.lead} <strong>{leadName}</strong>
                </span>
              </div>
            ) : null}
          </section>
        ) : null}

        {job.status === "delivered" && detail ? (
          <section aria-labelledby="job-close" className="flex flex-col gap-3 rounded-[18px] border border-success-border bg-success-surface p-4">
            <div className="flex flex-col gap-0.5">
              <h3 id="job-close" className={heading}>
                {p.close.title}
              </h3>
              <span className="text-[13px] text-success-foreground">{interpolate(p.close.text, { time: detail.deliveredAt ?? "" })}</span>
            </div>
            {/* Cerrar el trabajo aún no tiene flujo: los campos y el botón salen desactivados */}
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { key: "hours", label: p.close.hours, unit: "h", est: formatCompact(detail.estimate.hours) },
                  { key: "km", label: p.close.km, unit: "km", est: formatCompact(detail.estimate.km) },
                ] as const
              ).map((field) => (
                <label key={field.key} className="flex flex-col gap-1 text-[13px] font-bold">
                  {field.label}
                  <span className="flex h-10.5 items-center overflow-hidden rounded-xl border border-field-border bg-surface font-normal">
                    <input readOnly disabled placeholder={field.est} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] font-bold outline-none placeholder:text-field-placeholder" />
                    <span className="px-2.5 text-[13px] text-muted">{field.unit}</span>
                  </span>
                  <span className="text-xs font-normal text-muted">{interpolate(p.close.estimated, { value: field.est, unit: field.unit })}</span>
                </label>
              ))}
            </div>
            <span className="flex items-center gap-2 text-[13px] font-bold text-success-foreground">
              <span aria-hidden className="grid size-5 place-items-center rounded-full bg-success-dot text-[11px] text-white">
                ✓
              </span>
              {p.close.noIncidents}
            </span>
            <button
              type="button"
              disabled
              title={t.soon}
              className={`h-10.5 w-fit rounded-full bg-foreground px-4.5 text-sm font-bold text-background ${soon} ${focusRing}`}
            >
              {p.close.action}
            </button>
          </section>
        ) : null}

        {job.status === "closed" && detail?.actual ? (
          <section aria-labelledby="job-real" className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-surface-soft p-4">
            <h3 id="job-real" className={heading}>
              {p.real.title}
            </h3>
            <div className="flex flex-col gap-2 text-[13px]">
              <div className="grid grid-cols-[1fr_72px_72px_56px] gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                <span />
                <span>{p.real.estimated}</span>
                <span>{p.real.real}</span>
                <span />
              </div>
              {[
                { key: "hours", label: p.real.hours, est: detail.estimate.hours, real: detail.actual.hours, fmt: (n: number) => `${formatCompact(n)} h` },
                { key: "km", label: p.real.km, est: detail.estimate.km, real: detail.actual.km, fmt: (n: number) => formatCompact(n) },
                { key: "price", label: p.real.price, est: detail.priceCents ?? 0, real: detail.priceCents ?? 0, fmt: (n: number) => formatEuroWhole(n), same: true },
              ].map((row) => {
                const delta = row.same ? 0 : pctDelta(row.est, row.real);
                return (
                  <div key={row.key} className="grid grid-cols-[1fr_72px_72px_56px] items-center gap-2 border-t border-line-soft pt-2">
                    <strong>{row.label}</strong>
                    <span>{row.fmt(row.est)}</span>
                    <strong>{row.fmt(row.real)}</strong>
                    <span className={`text-xs font-bold ${delta > 5 ? "text-warn-foreground" : "text-success-foreground"}`}>
                      {row.same ? p.real.noExtras : delta === 0 ? p.real.equal : `${delta > 0 ? "+" : ""}${delta} %`}
                    </span>
                  </div>
                );
              })}
            </div>
            {detail.closed ? (
              <span className="text-xs text-muted">{interpolate(p.real.closedOn, { when: describeMoment(detail.closed, detail.closed.by, today, t) })}</span>
            ) : null}
            <button type="button" disabled title={t.soon} className={`h-9.5 w-fit rounded-full border border-field-border bg-surface px-4 text-[13px] font-bold text-foreground ${soon} ${focusRing}`}>
              {p.real.pdf}
            </button>
          </section>
        ) : null}

        <section aria-labelledby="job-vehicle" className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id="job-vehicle" className={heading}>
              {p.vehicle.title}
            </h3>
            {editable && vehicle ? (
              <button type="button" disabled title={t.soon} className={`text-[13px] font-bold text-foreground underline ${soon}`}>
                {p.vehicle.swap}
              </button>
            ) : null}
          </div>
          {vehicle ? (
            <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
              <span aria-hidden className="grid size-10 flex-none place-items-center rounded-xl bg-foreground text-background">
                <Icon name="truck" size={20} />
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <strong className="text-[15px]">{vehicle.name}</strong>
                <span className={`text-xs ${tooSmall ? "font-bold text-warn-foreground" : "text-muted"}`}>
                  {interpolate(tooSmall ? p.vehicle.tooSmall : p.vehicle.fits, { capacity: vehicle.capacityM3, volume })}
                </span>
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 rounded-2xl border-2 border-dashed border-warn-border bg-warn-surface p-3.5">
              <span className="text-[13px] text-warn-foreground">
                <strong>{p.vehicle.none}</strong> {interpolate(p.vehicle.needed, { volume })}
              </span>
              <button type="button" disabled title={t.soon} className={`h-9.5 w-fit rounded-full bg-foreground px-4 text-[13px] font-bold text-background ${soon} ${focusRing}`}>
                {p.vehicle.assign}
              </button>
            </div>
          )}
        </section>

        <section aria-labelledby="job-crew" className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id="job-crew" className={heading}>
              {p.crew.title}
            </h3>
            <span className={`text-[13px] font-bold ${missing.people > 0 ? "text-warn-foreground" : "text-success-foreground"}`}>
              {interpolate(p.crew.count, { have: crew.length, need: job.crewNeeded })}
            </span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {crew.map((person) => (
              <li key={person.id} className="flex items-center gap-2.5 rounded-[14px] bg-surface-soft px-2.5 py-2">
                <span aria-hidden className="grid size-8.5 flex-none place-items-center rounded-full bg-foreground text-xs font-bold text-background">
                  {initialsOf(person.name)}
                </span>
                <span className="flex flex-1 flex-col">
                  <strong className="text-sm">{person.name}</strong>
                  <span className="text-xs text-muted">{positions[person.position]}</span>
                </span>
                {editable ? (
                  <button type="button" disabled title={t.soon} aria-label={interpolate(p.crew.remove, { name: person.name })} className={`size-7.5 rounded-full text-muted ${soon}`}>
                    ✕
                  </button>
                ) : null}
              </li>
            ))}
            {Array.from({ length: missing.people }, (_, index) => (
              <li key={`slot-${index}`} className="flex items-center gap-2.5 rounded-[14px] border-2 border-dashed border-warn-border px-2.5 py-2">
                <span aria-hidden className="grid size-7.5 flex-none place-items-center rounded-full border-2 border-dashed border-field-border font-bold text-muted">
                  +
                </span>
                <span className="text-[13px] font-bold text-warn-foreground">
                  {index === 0 ? pluralize(lang, missing.people, p.crew.missing, { need: job.crewNeeded }) : p.crew.freeSlot}
                </span>
              </li>
            ))}
          </ul>

          {editable && missing.people > 0 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold">
                {interpolate(p.crew.available, { when: `${formatWeekdayShort(lang, job.date).toLowerCase()}, ${job.start}–${job.end}` })}
              </span>
              {suggestions.map(({ person, free: isFree, clash }) => (
                <button
                  key={person.id}
                  type="button"
                  disabled
                  title={t.soon}
                  className={`flex w-full items-center gap-2.5 rounded-[14px] border bg-surface px-2.5 py-2 text-left ${isFree ? "border-line" : "border-dashed border-line opacity-70"} ${soon} ${focusRing}`}
                >
                  <span
                    aria-hidden
                    className={`grid size-8 flex-none place-items-center rounded-full text-[11px] font-bold ${isFree ? "bg-status-config-surface text-foreground" : "bg-line-soft text-field-placeholder"}`}
                  >
                    {initialsOf(person.name)}
                  </span>
                  <span className="flex flex-1 flex-col text-left">
                    <strong className="text-sm">{person.name}</strong>
                    <span className={`text-xs ${isFree ? "text-success-foreground" : "text-muted"}`}>
                      {isFree || !clash ? p.crew.freeAllDay : interpolate(p.crew.busyOn, { start: clash.start, end: clash.end, id: clash.id })}
                    </span>
                  </span>
                  <span className={`text-[13px] font-bold ${isFree ? "text-foreground underline" : "text-field-placeholder"}`}>{isFree ? p.crew.assign : p.crew.busy}</span>
                </button>
              ))}
            </div>
          ) : null}
          {editable ? <p className="text-xs leading-snug text-muted">{p.crew.hint}</p> : null}
        </section>

        {detail ? (
          <section aria-labelledby="job-client" className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 id="job-client" className={heading}>
                {p.client.title}
              </h3>
              <Link href={localePath(lang, ROUTES.clients)} className={`text-[13px] font-bold text-foreground underline ${focusRing}`}>
                {p.client.view}
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-surface-soft px-3 py-2.5 text-[13px]">
              <span>
                <strong>{job.client}</strong> · {formatPhone(detail.clientPhone)}
              </span>
              <CopyButton variant="link" text={formatPhone(detail.clientPhone)} label={t.panel.client.copy} copiedLabel={t.panel.client.copied} />
            </div>
            {detail.addresses.map((address, index) => (
              <div key={address.kind} className="flex gap-2.5 rounded-[14px] border border-line-soft px-3 py-2.5">
                <span aria-hidden className={`mt-1 size-2.5 flex-none rounded-full ${index === 0 ? "bg-foreground" : "bg-primary"}`} />
                <span className="flex flex-1 flex-col gap-0.5 text-[13px]">
                  <span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{address.kind === "origin" ? p.client.origin : p.client.destination}</span> ·{" "}
                    <strong>{address.place}</strong>
                  </span>
                  <span className={`text-xs ${isHardAccess(address.access) ? "font-bold text-warn-foreground" : "text-muted"}`}>{describeAccess(address.access, t)}</span>
                </span>
              </div>
            ))}
          </section>
        ) : null}

        {detail ? (
          <section aria-labelledby="job-history" className="flex flex-col gap-2.5">
            <h3 id="job-history" className={heading}>
              {p.history.title}
            </h3>
            <ol className="flex flex-col gap-2.5">
              {detail.history.map((event) => {
                const text = describeHistory(event, ctx);
                return (
                  <li key={`${event.kind}-${event.at.date}-${event.at.time ?? ""}`} className="flex gap-2.5 text-[13px]">
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
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-3.5">
          <Link
            href={localePath(lang, ROUTES.jobs.detail(job.id))}
            className={`inline-flex h-10 items-center rounded-full border border-field-border bg-surface px-4 text-sm font-bold text-foreground ${focusRing}`}
          >
            {p.actions.open}
          </Link>
          {editable ? (
            <>
              <button type="button" disabled title={t.soon} className={`h-10 rounded-full border border-field-border bg-surface px-4 text-sm font-bold text-foreground ${soon} ${focusRing}`}>
                {p.actions.reschedule}
              </button>
              <button type="button" disabled title={t.soon} className={`h-10 px-1.5 text-[13px] font-bold text-danger-foreground underline ${soon} ${focusRing}`}>
                {p.actions.cancel}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

