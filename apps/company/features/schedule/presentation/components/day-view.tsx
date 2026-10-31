import Link from "next/link";

import type { Locale } from "@/app/i18n/config";
import { formatCubicMeters } from "@/app/lib/format";
import { jobsOn, toHours, type Show } from "../../domain/schedule";
import type { Person, ScheduleJob, Vehicle } from "../../domain/types";
import { scheduleHref } from "../schedule-href";
import type { PositionsText, ScheduleText } from "../schedule-text";
import { focusRing, initialsOf } from "./schedule-parts";

type Props = {
  lang: Locale;
  t: ScheduleText;
  positions: PositionsText;
  day: string;
  jobs: readonly ScheduleJob[];
  vehicles: readonly Vehicle[];
  people: readonly Person[];
  show: Show;
  selectedJobId: string | undefined;
};

const FIRST = 7;
const SPAN = 12;
const COLS = "grid-cols-[190px_1fr]";

const BAR = {
  "in-progress": "border-0 bg-primary text-primary-foreground",
  delivered: "border border-success-border bg-success-surface text-success-foreground",
  scheduled: "border border-foreground bg-surface text-foreground",
  closed: "border-0 bg-line-soft text-muted",
} as const;

/** "Furgão V-02" → "V2"; "Camião grande" → "CG". */
function vehicleIcon(name: string): string {
  const number = /V-0*(\d+)/.exec(name)?.[1];
  return number ? `V${number}` : name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
}

type Lane = { key: string; name: string; sub: string; icon: string; round: boolean; jobs: ScheduleJob[] };

/** Vista día por recurso: una fila por vehículo y por persona con sus trabajos como barras. */
export function DayView({ lang, t, positions, day, jobs, vehicles, people, show, selectedJobId }: Props) {
  const d = t.day;
  const dayJobs = jobsOn(jobs, day);
  const hours = Array.from({ length: SPAN / 2 + 1 }, (_, i) => FIRST + i * 2);

  const vehicleLanes: Lane[] = vehicles.map((vehicle) => ({
    key: `v-${vehicle.id}`,
    name: vehicle.name,
    sub: formatCubicMeters(vehicle.capacityM3),
    icon: vehicleIcon(vehicle.name),
    round: false,
    jobs: dayJobs.filter((job) => job.vehicleId === vehicle.id),
  }));
  const personLanes: Lane[] = people.map((person) => ({
    key: `p-${person.id}`,
    name: person.name,
    sub: positions[person.position],
    icon: initialsOf(person.name),
    round: true,
    jobs: dayJobs.filter((job) => job.crewIds.includes(person.id)),
  }));

  const renderLane = (lane: Lane) => (
    <div key={lane.key} className={`grid ${COLS} items-center py-1`}>
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden
          className={`grid size-8 flex-none place-items-center text-[11px] font-bold ${lane.round ? "rounded-full bg-status-config-surface text-foreground" : "rounded-[10px] bg-foreground text-background"}`}
        >
          {lane.icon}
        </span>
        <span className="flex min-w-0 flex-col">
          <strong className="text-sm whitespace-nowrap">{lane.name}</strong>
          <span className="text-xs whitespace-nowrap text-muted">{lane.sub}</span>
        </span>
      </span>
      <span
        className={`relative h-11 rounded-xl ${lane.jobs.length === 0 ? "bg-success-surface" : "bg-surface-soft"}`}
        style={{
          backgroundImage: "linear-gradient(to right, var(--line-soft) 1px, transparent 1px)",
          backgroundSize: `calc(100% / ${SPAN}) 100%`,
        }}
      >
        {lane.jobs.length === 0 ? (
          <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-bold text-success-foreground">{d.freeAllDay}</span>
        ) : null}
        {lane.jobs.map((job) => {
          const start = toHours(job.start);
          const end = toHours(job.end);
          return (
            <Link
              key={job.id}
              href={scheduleHref(lang, { view: "day", date: day, show, job: job.id })}
              scroll={false}
              className={`absolute top-1.5 bottom-1.5 box-border overflow-hidden rounded-[10px] px-2.5 text-xs leading-8.5 font-bold text-ellipsis whitespace-nowrap ${BAR[job.status]} ${focusRing} ${job.id === selectedJobId ? "shadow-[0_0_0_3px_var(--foreground)]" : ""}`}
              style={{ left: `${((start - FIRST) / SPAN) * 100}%`, width: `calc(${((end - start) / SPAN) * 100}% - 3px)` }}
            >
              {job.id} · {job.client}
            </Link>
          );
        })}
      </span>
    </div>
  );

  return (
    <section aria-label={d.label} className="overflow-x-auto rounded-3xl border border-line bg-surface px-4 pt-3 pb-4">
      <div className="flex min-w-190 flex-col">
        <div className={`grid ${COLS} items-end border-b border-line-soft pb-1.5`}>
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{d.resource}</span>
          <span className="relative h-4.5">
            {hours.map((hour) => (
              <span
                key={hour}
                className="absolute text-[11px] text-muted"
                style={{ left: `${((hour - FIRST) / SPAN) * 100}%`, transform: hour === FIRST ? undefined : "translateX(-50%)" }}
              >
                {String(hour).padStart(2, "0")}h
              </span>
            ))}
          </span>
        </div>
        <span className="pt-3.5 pb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{d.vehicles}</span>
        {vehicleLanes.map(renderLane)}
        <span className="pt-3.5 pb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{d.people}</span>
        {personLanes.map(renderLane)}
      </div>
    </section>
  );
}
