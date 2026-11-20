import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import {
  formatDate,
  formatDayMonthShort,
  formatInteger,
  formatMonthName,
  formatWeekdayDay,
} from "@/app/lib/format";
import { acceptanceRate, addDays, isIdle } from "../../domain/fleet";
import type { Vehicle } from "../../domain/types";
import { describeEvent, describeStatus, type FleetText } from "../fleet-text";
import { PanelEscape } from "@/app/components/panel-escape";
import { VEHICLE_TYPES, type VehicleType } from "../../domain/new-vehicle";
import { StatusPill, VehicleTile, focusRing } from "./fleet-parts";
import { VehicleActiveSwitch } from "./vehicle-active-switch";
import { VehicleDataForm } from "./vehicle-data-form";

type Props = {
  lang: Locale;
  t: FleetText;
  vehicle: Vehicle;
  today: string;
  /** Posición 1..total entre los vehículos visibles, para "Veículo 3 de 6". */
  position: number;
  total: number;
  previousHref: string;
  nextHref: string;
  closeHref: string;
  /** El coste por km solo lo ve el administrador (RNF-03). */
  showCost: boolean;
};

/** Horas de un día completo en la barra del gráfico semanal. */
const FULL_DAY_HOURS = 10;

const iconButton =
  "grid size-9 place-items-center rounded-full text-foreground " + focusRing;
const statBox = "flex flex-col gap-0.5 rounded-[14px] bg-surface-head p-3";
const statValue = "font-display text-[22px] font-bold";
const heading = "text-base font-bold";

/** Panel lateral del vehículo (P7): estado, semana, trabajos, presupuestos, datos, uso y histórico. */
export function VehiclePanel({
  lang,
  t,
  vehicle,
  today,
  position,
  total,
  previousHref,
  nextHref,
  closeHref,
  showCost,
}: Props) {
  const p = t.panel;
  const status = describeStatus(vehicle, t);
  const week = vehicle.weekHours.map((hours, index) => ({ hours, day: formatWeekdayDay(lang, addDays(today, index)) }));
  const busyDays = week.filter((d) => d.hours > 0).length;
  const busyHours = week.reduce((sum, d) => sum + d.hours, 0);
  const rate = acceptanceRate(vehicle);
  const { quotes30d, usage } = vehicle;
  const [nextWarnJob] = vehicle.jobs.filter((job) => job.date > today);
  const showUsageNote = isIdle(vehicle, today);

  return (
    <aside
      aria-labelledby="vehicle-panel-title"
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
            <VehicleTile vehicle={vehicle} size={60} iconSize={28} radius="rounded-[18px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h2 id="vehicle-panel-title" className="font-display text-[26px] leading-[1.1] font-extrabold">
                {vehicle.name}
              </h2>
              <span className="flex flex-wrap items-center gap-2">
                {/* Matrícula portuguesa: banda azul con la "P" */}
                <span className="inline-flex h-6.5 items-center overflow-hidden rounded-md border-2 border-foreground bg-surface font-mono text-[13px] font-bold">
                  <span aria-hidden className="flex h-full items-center bg-foreground px-1.25 text-[10px] text-background">
                    P
                  </span>
                  <span className="px-2">{vehicle.plate}</span>
                </span>
                <span className="text-[13px] text-muted">{t.new.types[vehicle.type].label}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-surface-soft px-3.5 py-3">
            <span className="flex flex-wrap items-center gap-2">
              <StatusPill state={status.state} label={status.label} />
              <span className="text-[13px] text-muted">{status.note}</span>
            </span>
            <VehicleActiveSwitch
              key={`${vehicle.id}-${vehicle.active}`}
              lang={lang}
              vehicleId={vehicle.id}
              name={vehicle.name}
              active={vehicle.active}
              t={{
                panel: { on: p.on, off: p.off, activate: p.activate, deactivate: p.deactivate, deactivation: p.deactivation },
                formErrors: p.data.formErrors,
              }}
            />
          </div>

          {!vehicle.active && nextWarnJob ? (
            <div className="flex gap-2.5 rounded-[14px] border border-warn-border bg-warn-surface px-3.5 py-3 text-[13px] leading-snug text-warn-foreground">
              <Icon name="info" size={18} className="flex-none" />
              <span>
                {pluralize(lang, vehicle.jobs.length, p.pendingJobs, {
                  date: formatDate(nextWarnJob.date),
                  orderId: nextWarnJob.orderId,
                })}
              </span>
            </div>
          ) : null}
        </div>

        <section aria-labelledby="vehicle-week" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id="vehicle-week" className={heading}>
              {p.week.title}
            </h3>
            <span className="text-[13px] text-muted">
              {busyDays === 0
                ? p.week.allFree
                : pluralize(lang, busyDays, p.week.summary, { hours: formatInteger(busyHours) })}
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

        <section aria-labelledby="vehicle-jobs" className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id="vehicle-jobs" className={heading}>
              {p.jobs.title}
            </h3>
            {/* La agenda aún no existe */}
            <span title={t.soon} className="cursor-not-allowed text-[13px] font-bold opacity-50">
              {p.jobs.viewSchedule}
            </span>
          </div>
          {vehicle.jobs.length === 0 ? (
            <p className="rounded-[14px] bg-surface-soft p-3.5 text-sm text-muted">{p.jobs.none}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {vehicle.jobs.map((job) => {
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
                        {job.orderId} · {job.from} → {job.to}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="vehicle-quotes" className="flex flex-col gap-2.5">
          <h3 id="vehicle-quotes" className={heading}>
            {p.quotes.title}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <span className={statBox}>
              <strong className={statValue}>{quotes30d.total}</strong>
              <span className="text-xs text-muted">{pluralize(lang, quotes30d.total, t.quotesWord)}</span>
            </span>
            <span className="flex flex-col gap-0.5 rounded-[14px] bg-success-surface p-3 text-success-foreground">
              <strong className={statValue}>{quotes30d.accepted}</strong>
              <span className="text-xs">{p.quotes.accepted}</span>
            </span>
            <span className={statBox}>
              <strong className={statValue}>{rate === null ? "—" : `${Math.round(rate * 100)} %`}</strong>
              <span className="text-xs text-muted">{p.quotes.rate}</span>
            </span>
          </div>
        </section>

        {showCost ? (
          // Editar exige ver el coste por km, que solo ve el administrador (RNF-03); solo él entra en el panel.
          <VehicleDataForm
            key={vehicle.id}
            lang={lang}
            vehicle={vehicle}
            t={{
              data: p.data,
              errors: t.new.errors,
              types: Object.fromEntries(VEHICLE_TYPES.map((type) => [type, t.new.types[type].label])) as Record<VehicleType, string>,
            }}
          />
        ) : null}

        <section aria-labelledby="vehicle-usage" className="flex flex-col gap-2.5">
          <h3 id="vehicle-usage" className={heading}>
            {interpolate(p.usage.title, { month: formatMonthName(lang, today).toLowerCase() })}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <span className={statBox}>
              <strong className={statValue}>{usage.jobs}</strong>
              <span className="text-xs text-muted">{p.usage.jobs}</span>
            </span>
            <span className={statBox}>
              <strong className={statValue}>{formatInteger(usage.km)}</strong>
              <span className="text-xs text-muted">km</span>
            </span>
            <span className={statBox}>
              <strong className={statValue}>{usage.hours}</strong>
              <span className="text-xs text-muted">{p.usage.hours}</span>
            </span>
          </div>
          {showUsageNote ? <span className="text-[13px] font-bold text-warn-foreground">{p.usage.lowUse}</span> : null}
        </section>

        <section aria-labelledby="vehicle-history" className="flex flex-col gap-2.5">
          <h3 id="vehicle-history" className={heading}>
            {p.history.title}
          </h3>
          <ol className="flex flex-col gap-2.5">
            {vehicle.history.map((event) => {
              const text = describeEvent(event, t);
              return (
                <li key={event.id} className="flex gap-2.5 text-[13px]">
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
