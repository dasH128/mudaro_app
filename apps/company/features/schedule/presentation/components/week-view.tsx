import Link from "next/link";

import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatWeekdayShort } from "@/app/lib/format";
import { jobsOn, layoutOverlaps, missingOf, toHours, vehicleOf, type Show } from "../../domain/schedule";
import type { Person, ScheduleJob, Vehicle } from "../../domain/types";
import { scheduleHref } from "../schedule-href";
import { firstName, joinNames, type ScheduleText } from "../schedule-text";
import { focusRing, initialsOf } from "./schedule-parts";

type Props = {
  lang: Locale;
  t: ScheduleText;
  /** Los 7 días de la semana, de lunes a domingo. */
  days: string[];
  jobs: readonly ScheduleJob[];
  vehicles: readonly Vehicle[];
  people: readonly Person[];
  today: string;
  /** Hora actual de Lisboa en decimal (15,33); `null` fuera del horario de la agenda. */
  nowHour: number | null;
  show: Show;
  selectedJobId: string | undefined;
};

/** Altura de una hora y primera hora que se dibuja (de 07:00 a 19:00). */
const HOUR_PX = 52;
const FIRST_HOUR = 7;
const HOURS = 12;

const BLOCK = {
  "in-progress": "border-0 bg-primary text-primary-foreground",
  delivered: "border border-success-border bg-success-surface text-success-foreground",
  closed: "border-0 bg-line-soft text-muted",
} as const;
const MISSING = "border-2 border-dashed border-primary bg-warn-surface text-foreground";
const READY = "border border-foreground border-l-[5px] bg-surface text-foreground";

function blockLook(job: ScheduleJob): string {
  if (job.status === "scheduled") return missingOf(job).total > 0 ? MISSING : READY;
  return BLOCK[job.status];
}

function badgeOf(job: ScheduleJob, t: ScheduleText): { text: string; look: string } | null {
  if (job.status === "in-progress") return { text: t.week.badge["in-progress"], look: "bg-foreground text-background" };
  if (job.status === "delivered") return { text: t.week.badge.delivered, look: "bg-surface text-success-foreground" };
  const { total } = missingOf(job);
  if (job.status === "scheduled" && total > 0) return { text: interpolate(t.week.badge.missing, { count: total }), look: "bg-primary text-primary-foreground" };
  return null;
}

/** Vista semana: siete columnas de 07:00 a 19:00 con cada trabajo como un bloque. */
export function WeekView({ lang, t, days, jobs, vehicles, people, today, nowHour, show, selectedJobId }: Props) {
  const w = t.week;
  const crewOf = (job: ScheduleJob) => job.crewIds.flatMap((id) => people.find((p) => p.id === id) ?? []);

  return (
    <section aria-label={w.label} className="overflow-x-auto rounded-3xl border border-line bg-surface px-3 pt-3 pb-4">
      <div className="grid min-w-180 grid-cols-[48px_repeat(7,minmax(0,1fr))] gap-x-1.5">
        <span />
        {days.map((day) => {
          const count = jobsOn(jobs, day).length;
          const isToday = day === today;
          return (
            <span
              key={day}
              className={`flex flex-col items-center gap-0.75 rounded-[14px] pt-2 pb-2.5 ${isToday ? "bg-foreground text-background" : day < today ? "text-field-placeholder" : "text-foreground"}`}
            >
              <span className="text-xs font-bold uppercase tracking-[0.08em]">{formatWeekdayShort(lang, day)}</span>
              <span className="font-display text-[22px] leading-none font-extrabold">{Number(day.slice(8))}</span>
              <span className="text-[11px]">{count > 0 ? pluralize(lang, count, w.count) : w.free}</span>
            </span>
          );
        })}

        <span className="relative" style={{ height: HOURS * HOUR_PX }}>
          {Array.from({ length: HOURS }, (_, i) => FIRST_HOUR + i).map((hour) => (
            <span key={hour} className="absolute right-1.5 text-[11px] text-muted" style={{ top: (hour - FIRST_HOUR) * HOUR_PX - 6 }}>
              {String(hour).padStart(2, "0")}:00
            </span>
          ))}
        </span>
        {days.map((day, index) => {
          const isToday = day === today;
          return (
            <div
              key={day}
              className={`relative rounded-xl ${isToday ? "bg-warn-surface/50" : index >= 5 ? "bg-surface-soft" : "bg-surface"}`}
              style={{
                height: HOURS * HOUR_PX,
                backgroundImage: `repeating-linear-gradient(to bottom, var(--line-soft) 0 1px, transparent 1px ${HOUR_PX}px)`,
              }}
            >
              {isToday && nowHour !== null ? (
                <span aria-hidden className="absolute right-0 -left-1 z-2 h-0.5 bg-primary" style={{ top: (nowHour - FIRST_HOUR) * HOUR_PX }}>
                  <span className="absolute -top-1 -left-0.5 size-2.5 rounded-full bg-primary" />
                </span>
              ) : null}
              {(() => {
                const dayJobs = jobsOn(jobs, day);
                const layout = layoutOverlaps(dayJobs);
                return dayJobs.map((job) => {
                  const slot = layout.get(job.id) ?? { col: 0, cols: 1 };
                const selected = job.id === selectedJobId;
                const badge = badgeOf(job, t);
                const vehicle = vehicleOf(job, vehicles);
                const crew = crewOf(job);
                const start = toHours(job.start);
                const end = toHours(job.end);
                const { total } = missingOf(job);
                const status =
                  job.status === "in-progress"
                    ? t.status["in-progress"]
                    : job.status === "delivered"
                      ? w.tip.toClose
                      : job.status === "closed"
                        ? t.status.closed
                        : total > 0
                          ? pluralize(lang, total, w.tip.missing)
                          : w.tip.ready;
                return (
                  <span
                    key={job.id}
                    className={`group/job absolute block hover:z-40 focus-within:z-40 ${selected ? "z-3" : "z-1"}`}
                    style={{
                      top: (start - FIRST_HOUR) * HOUR_PX + 2,
                      height: (end - start) * HOUR_PX - 4,
                      left: `calc(${(slot.col / slot.cols) * 100}% + 3px)`,
                      width: `calc(${100 / slot.cols}% - 6px)`,
                    }}
                  >
                    <Link
                      href={scheduleHref(lang, { view: "week", date: day, show, job: job.id })}
                      scroll={false}
                      aria-label={interpolate(w.aria, { id: job.id, client: job.client, start: job.start, end: job.end })}
                      className={`relative flex size-full flex-col gap-0.5 overflow-hidden rounded-xl px-2 py-1.5 text-left ${blockLook(job)} ${focusRing} ${selected ? "shadow-[0_0_0_3px_var(--foreground)]" : ""}`}
                    >
                      <span className="flex items-center justify-between gap-1 text-[11px] font-bold">
                        {job.start}–{job.end}
                        {badge ? <span className={`rounded-full px-1.5 py-px text-[10px] ${badge.look}`}>{badge.text}</span> : null}
                      </span>
                      <span className="text-[13px] leading-tight font-bold">{job.client}</span>
                      <span className="text-[11px] opacity-85">
                        {job.id} · {vehicle?.name ?? w.noVehicle}
                      </span>
                      <span className="mt-0.5 flex">
                        {crew.map((person, k) => (
                          <span
                            key={person.id}
                            aria-hidden
                            className={`grid size-5.5 place-items-center rounded-full border-2 text-[9px] font-bold ${k ? "-ml-1.5" : ""} ${job.status === "in-progress" ? "border-primary" : "border-surface"} ${job.status === "closed" ? "bg-status-off-border text-muted" : "bg-foreground text-background"}`}
                          >
                            {initialsOf(person.name)}
                          </span>
                        ))}
                      </span>
                    </Link>
                    <span
                      role="tooltip"
                      className={`pointer-events-none absolute top-0 z-30 hidden w-55 flex-col gap-1 rounded-[14px] bg-foreground px-3.5 py-3 text-left text-background shadow-lg group-focus-within/job:flex group-hover/job:flex ${index >= 5 ? "right-[calc(100%+8px)]" : "left-[calc(100%+8px)]"}`}
                    >
                      <strong className="text-sm">{job.client}</strong>
                      <span className="text-xs opacity-80">
                        {job.id} · {job.start}–{job.end}
                      </span>
                      <span className="text-xs">{interpolate(w.tip.vehicle, { name: vehicle?.name ?? w.tip.noVehicle })}</span>
                      <span className="text-xs">
                        {interpolate(w.tip.crew, {
                          names: crew.length ? joinNames(crew.map((p) => firstName(p.name)), lang) : w.tip.nobody,
                          have: crew.length,
                          need: job.crewNeeded,
                        })}
                      </span>
                      <span className="mt-0.5 text-xs font-bold">{status}</span>
                      <span className="text-[11px] opacity-70">{w.openHint}</span>
                    </span>
                  </span>
                );
                });
              })()}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3.5 px-1.5 pt-3.5 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="box-border size-3.5 rounded-sm border border-l-4 border-foreground bg-surface" />
          {w.legend.scheduled}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3.5 rounded-sm bg-primary" />
          {w.legend["in-progress"]}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="box-border size-3.5 rounded-sm border border-success-border bg-success-surface" />
          {w.legend.delivered}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3.5 rounded-sm bg-line-soft" />
          {w.legend.closed}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="box-border size-3.5 rounded-sm border-2 border-dashed border-primary" />
          {w.legend.missing}
        </span>
      </div>
    </section>
  );
}
