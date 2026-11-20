import Link from "next/link";

import { CopyButton } from "@/app/components/copy-button";
import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatCompact, formatCubicMeters, formatDayMonth, formatEuroWhole, formatPhone, formatWeekdayShort } from "@/app/lib/format";
import { ROUTES, localePath } from "@/app/lib/routes";
import { missingOf, vehicleOf } from "@/features/schedule/domain/schedule";
import type { ScheduleJob, ScheduleOverview } from "@/features/schedule/domain/types";
import { JobActions } from "@/features/schedule/presentation/components/job-actions";
import { jobOptions } from "@/features/schedule/presentation/job-options";
import { JobStatusPill, focusRing } from "@/features/schedule/presentation/components/schedule-parts";
import { scheduleHref } from "@/features/schedule/presentation/schedule-href";
import { describeAccess, describeHistory, isHardAccess, type PositionsText, type ScheduleText } from "@/features/schedule/presentation/schedule-text";
import { crewSummary, type JobsText } from "../job-summary-text";

type Props = {
  lang: Locale;
  t: JobsText;
  schedule: ScheduleText;
  positions: PositionsText;
  job: ScheduleJob;
  overview: ScheduleOverview;
  today: string;
};

const card = "flex flex-col gap-3.5 rounded-3xl border border-line bg-surface p-5.5";
const heading = "text-base font-bold";
const statBox = "flex flex-col gap-0.5 rounded-[14px] bg-surface-head p-3";
const statValue = "font-display text-[22px] font-bold";
const ghost = `inline-flex h-10 items-center gap-2 rounded-full border border-field-border bg-surface px-4 text-sm font-bold text-foreground ${focusRing}`;

/**
 * Ficha del trabajo (paso 6.3). Sin prototipo: sigue la línea del detalle del pedido y del panel de la Agenda.
 * Las fotos, actas e incidencias llegan con el paso 6.5; el cierre, con el 6.6.
 */
export function JobSheet({ lang, t, schedule, positions, job, overview, today }: Props) {
  const p = schedule.panel;
  const detail = job.detail;
  const vehicle = vehicleOf(job, overview.vehicles);
  const crew = job.crewIds.flatMap((id) => overview.people.find((person) => person.id === id) ?? []);
  const lead = overview.people.find((person) => person.id === detail?.leadId);
  const missing = missingOf(job);
  const volume = formatCubicMeters(job.volumeM3);
  const tooSmall = vehicle !== undefined && vehicle.capacityM3 < job.volumeM3;
  const editable = job.status === "scheduled";
  const actionable = job.status === "scheduled" || job.status === "in-progress";
  const summary = crewSummary(job, { vehicle, crew, lead }, { t, schedule, locale: lang });

  const { vehicles: vehicleOptions, people: peopleOptions } = jobOptions(job, overview, p.edit, positions);

  const when = `${formatWeekdayShort(lang, job.date)} ${formatDayMonth(job.date)} · ${job.start}–${job.end}`;
  const ctx = { t: schedule, locale: lang, today, people: overview.people };

  return (
    <>
      <header className="flex flex-col gap-3">
        <nav aria-label={t.breadcrumb} className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Link href={scheduleHref(lang, { view: "day", date: job.date, job: job.id })} className={`font-bold text-foreground underline ${focusRing}`}>
            {schedule.title}
          </Link>
          <Icon name="chevronRight" size={14} />
          <span aria-current="page" className="font-mono">
            {job.id}
          </span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</span>
              <JobStatusPill status={job.status} label={schedule.status[job.status]} />
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">{job.client}</h1>
            <span className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-head px-3 text-[13px] font-bold">
                <Icon name="calendar" size={14} strokeWidth={2.2} />
                {when}
              </span>
              <span className="inline-flex h-8 items-center rounded-full bg-surface-head px-3 text-[13px]">{interpolate(p.volume, { volume })}</span>
            </span>
          </div>
          <Link href={localePath(lang, ROUTES.orders.detail(job.id))} className={ghost}>
            {t.viewOrder}
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
          <section aria-labelledby="sheet-crew" className={card}>
            <h2 id="sheet-crew" className={heading}>
              {t.crewTitle}
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className={`flex items-center gap-3 rounded-2xl p-3 ${vehicle ? "border border-line" : "border-2 border-dashed border-warn-border bg-warn-surface"}`}>
                <span aria-hidden className="grid size-10 flex-none place-items-center rounded-xl bg-foreground text-background">
                  <Icon name="truck" size={20} />
                </span>
                <span className="flex flex-col gap-0.5">
                  <strong className="text-[15px]">{vehicle?.name ?? p.vehicle.none}</strong>
                  <span className={`text-xs ${tooSmall || !vehicle ? "font-bold text-warn-foreground" : "text-muted"}`}>
                    {vehicle ? interpolate(tooSmall ? p.vehicle.tooSmall : p.vehicle.fits, { capacity: vehicle.capacityM3, volume }) : interpolate(p.vehicle.needed, { volume })}
                  </span>
                </span>
              </div>
              <div className={`flex flex-col gap-1 rounded-2xl p-3 ${missing.people > 0 ? "border-2 border-dashed border-warn-border bg-warn-surface" : "border border-line"}`}>
                <strong className="text-[15px]">{interpolate(p.crew.count, { have: crew.length, need: job.crewNeeded })}</strong>
                <span className="text-xs text-muted">
                  {crew.length === 0
                    ? t.noCrew
                    : crew.map((person) => (person.id === lead?.id ? interpolate(t.summary.lead, { name: person.name }) : person.name)).join(", ")}
                </span>
                {missing.people > 0 ? (
                  <span className="text-xs font-bold text-warn-foreground">{pluralize(lang, missing.people, p.crew.missing, { need: job.crewNeeded })}</span>
                ) : null}
              </div>
            </div>
            {actionable ? (
              <JobActions
                key={[job.jobId, job.date, job.start, job.end, job.vehicleId, detail?.leadId, ...job.crewIds].join("|")}
                lang={lang}
                job={{ jobId: job.jobId, date: job.date, start: job.start, end: job.end, vehicleId: job.vehicleId, crewIds: job.crewIds, leadId: detail?.leadId ?? null }}
                canReschedule={editable}
                vehicles={vehicleOptions}
                people={peopleOptions}
                t={p.edit}
              />
            ) : null}
          </section>

          {detail ? (
            <section aria-labelledby="sheet-addresses" className={card}>
              <h2 id="sheet-addresses" className={heading}>
                {t.addressesTitle}
              </h2>
              {detail.addresses.map((address, index) => (
                <div key={address.kind} className="flex gap-2.5 rounded-[14px] border border-line-soft px-3.5 py-3">
                  <span aria-hidden className={`mt-1 size-2.5 flex-none rounded-full ${index === 0 ? "bg-foreground" : "bg-primary"}`} />
                  <span className="flex flex-1 flex-col gap-0.5 text-sm">
                    <span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                        {address.kind === "origin" ? p.client.origin : p.client.destination}
                      </span>{" "}
                      · <strong>{address.place}</strong>
                    </span>
                    <span className={`text-[13px] ${isHardAccess(address.access) ? "font-bold text-warn-foreground" : "text-muted"}`}>
                      {describeAccess(address.access, schedule)}
                    </span>
                  </span>
                </div>
              ))}
            </section>
          ) : null}

          {detail ? (
            <section aria-labelledby="sheet-estimate" className={card}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="sheet-estimate" className={heading}>
                  {t.estimateTitle}
                </h2>
                <span className="text-xs text-muted">{t.actualLater}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <span className={statBox}>
                  <strong className={statValue}>{formatCompact(detail.estimate.hours)} h</strong>
                  <span className="text-xs text-muted">{t.hours}</span>
                </span>
                <span className={statBox}>
                  <strong className={statValue}>{formatCompact(detail.estimate.km)}</strong>
                  <span className="text-xs text-muted">km</span>
                </span>
                <span className={statBox}>
                  <strong className={statValue}>{job.crewNeeded}</strong>
                  <span className="text-xs text-muted">{t.people}</span>
                </span>
                <span className={statBox}>
                  <strong className={statValue}>{detail.priceCents === undefined ? "—" : formatEuroWhole(detail.priceCents)}</strong>
                  <span className="text-xs text-muted">{t.price}</span>
                </span>
              </div>
            </section>
          ) : null}
        </div>

        <div className="flex min-w-72 flex-[1_1_340px] flex-col gap-5">
          <section aria-labelledby="sheet-share" className={card}>
            <div className="flex flex-col gap-1">
              <h2 id="sheet-share" className={heading}>
                {t.shareTitle}
              </h2>
              <p className="text-[13px] text-muted">{t.shareText}</p>
            </div>
            <pre className="whitespace-pre-wrap rounded-[14px] bg-surface-soft p-3.5 font-sans text-[13px] leading-relaxed">{summary}</pre>
            <span className="flex flex-wrap gap-2">
              <CopyButton text={summary} label={t.copy} copiedLabel={t.copied} />
              <a
                href={`https://wa.me/?text=${encodeURIComponent(summary)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={ghost}
              >
                <Icon name="message" size={16} strokeWidth={2.2} />
                {t.whatsapp}
              </a>
            </span>
          </section>

          {detail ? (
            <section aria-labelledby="sheet-client" className={card}>
              <h2 id="sheet-client" className={heading}>
                {p.client.title}
              </h2>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-surface-soft px-3 py-2.5 text-[13px]">
                <span>
                  <strong>{job.client}</strong> · {formatPhone(detail.clientPhone)}
                </span>
                <CopyButton variant="link" text={formatPhone(detail.clientPhone)} label={p.client.copy} copiedLabel={p.client.copied} />
              </div>
            </section>
          ) : null}

          {detail && detail.history.length > 0 ? (
            <section aria-labelledby="sheet-history" className={card}>
              <h2 id="sheet-history" className={heading}>
                {p.history.title}
              </h2>
              <ol className="flex flex-col gap-2.5">
                {detail.history.map((event, index) => {
                  const text = describeHistory(event, ctx);
                  return (
                    <li key={`${event.kind}-${event.at.date}-${event.at.time ?? ""}-${index}`} className="flex gap-2.5 text-[13px]">
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
        </div>
      </div>
    </>
  );
}
