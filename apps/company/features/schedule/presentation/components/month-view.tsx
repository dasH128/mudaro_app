import Link from "next/link";

import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatDayMonthShort, formatWeekday, formatWeekdayShort } from "@/app/lib/format";
import {
  dayLoad,
  issuesOf,
  monthGrid,
  monthOf,
  startOfWeek,
  type DayLoad,
  type Level,
  type Show,
} from "../../domain/schedule";
import type { ScheduleOverview } from "../../domain/types";
import { scheduleHref } from "../schedule-href";
import { describeIssues, type ScheduleText } from "../schedule-text";
import { focusRing } from "./schedule-parts";

type Props = {
  lang: Locale;
  t: ScheduleText;
  overview: ScheduleOverview;
  /** Trabajos ya filtrados por "Mostrar". */
  jobs: ScheduleOverview["jobs"];
  /** Cualquier día del mes que se muestra. */
  date: string;
  today: string;
  /** Día elegido, con su detalle debajo. */
  selected: string;
  show: Show;
  monthLabel: string;
};

const BAR: Record<Level, string> = {
  free: "bg-line-soft",
  room: "bg-success-dot",
  "almost-full": "bg-warn-border",
  full: "bg-primary",
};
const LEVEL_PILL: Record<Level, string> = {
  free: "bg-line-soft text-muted",
  room: "bg-success-surface text-success-foreground",
  "almost-full": "bg-warn-surface text-warn-foreground",
  full: "bg-primary text-primary-foreground",
};
const LEGEND_BAR: Record<Level, string> = BAR;

/** Vista mes: disponibilidad. Cada día pesa por las personas que piden las mudanças aceptadas. */
export function MonthView({ lang, t, overview, jobs, date, today, selected, show, monthLabel }: Props) {
  const m = t.month;
  const grid = monthGrid(date);
  const month = monthOf(date);
  const weekStart = startOfWeek(grid[0] ?? date);
  const loads = new Map<string, DayLoad>(grid.map((day) => [day, dayLoad(day, overview, jobs)]));
  const inMonth = grid.filter((day) => monthOf(day) === month);

  const monthJobs = inMonth.reduce((sum, day) => sum + (loads.get(day)?.jobs.length ?? 0), 0);
  const fullDays = inMonth.filter((day) => loads.get(day)?.level === "full").length;
  const issueDays = inMonth.filter((day) => (loads.get(day)?.issues ?? 0) > 0).length;

  const sel = loads.get(selected) ?? dayLoad(selected, overview, jobs);
  const selectedTitle = `${formatWeekday(lang, selected)}, ${formatDayMonthShort(lang, selected).day} ${formatDayMonthShort(lang, selected).month}`;

  return (
    <section aria-label={m.label} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface px-3.5 pt-3.5 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
        <span className="text-sm">
          <strong>{pluralize(lang, monthJobs, m.summary, { month: monthLabel.split(" ")[0]?.toLowerCase() ?? "" })}</strong>{" "}
          <span className="text-muted">
            · {pluralize(lang, fullDays, m.full)} · {pluralize(lang, issueDays, m.issues)}
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-3 text-xs text-muted">
          {(Object.keys(LEGEND_BAR) as Level[]).map((level) => (
            <span key={level} className="inline-flex items-center gap-1.25">
              <span className={`h-1.5 w-4.5 rounded-full ${LEGEND_BAR[level]}`} />
              {m.levels[level]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.25">
            <span className="box-border h-3 w-4.5 rounded-sm border border-dashed border-field-border" />
            {m.pending}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
            {formatWeekdayShort(lang, grid[i] ?? weekStart)}
          </span>
        ))}
        {grid.map((day, index) => {
          const load = loads.get(day) as DayLoad;
          const out = monthOf(day) !== month;
          const past = day < today;
          const isToday = day === today;
          const on = day === selected;
          const weekend = index % 7 >= 5;
          const first = formatDayMonthShort(lang, day);
          const num = day.endsWith("-01") ? `${Number(day.slice(8))} ${first.month}` : String(Number(day.slice(8)));
          const issueJobs = load.jobs.filter((job) => issuesOf(job, overview.vehicles).length > 0);
          const text = load.jobs.length ? `${pluralize(lang, load.jobs.length, m.cellJobs)}, ${m.levels[load.level]}` : m.cellFree;
          return (
            <Link
              key={day}
              href={scheduleHref(lang, { view: "month", date, show, day })}
              scroll={false}
              aria-current={on ? "true" : undefined}
              aria-label={interpolate(m.cellAria, { day: `${Number(day.slice(8))} ${first.month}`, text })}
              className={`flex min-h-26 min-w-0 flex-col gap-1.25 overflow-hidden rounded-[14px] p-2 text-left text-foreground ${focusRing} ${
                on ? "border-2 border-foreground" : isToday ? "border-2 border-primary" : "border border-line-soft"
              } ${out || past ? "bg-surface-soft opacity-60" : weekend ? "bg-surface-soft" : "bg-surface"}`}
            >
              <span className="flex items-center justify-between gap-1">
                <span className={`text-[13px] font-bold ${isToday ? "rounded-full bg-primary px-1.75 py-px text-primary-foreground" : ""}`}>{num}</span>
                {load.issues > 0 ? (
                  <span aria-hidden className="inline-grid size-4.5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    !
                  </span>
                ) : null}
              </span>
              <span aria-hidden className="block h-1.25 overflow-hidden rounded-full bg-line-soft">
                <span className={`block h-full rounded-full ${BAR[load.level]}`} style={{ width: `${Math.min(100, Math.round(load.load * 100))}%` }} />
              </span>
              {load.jobs.length > 0 ? <span className="text-[11px] text-muted">{pluralize(lang, load.jobs.length, m.cellJobs)}</span> : null}
              {load.jobs.slice(0, 2).map((job) => (
                <span
                  key={job.id}
                  className={`block truncate rounded-md px-1.5 py-0.5 text-[11px] font-bold ${issueJobs.includes(job) ? "bg-warn-surface text-warn-foreground" : "bg-background text-foreground"}`}
                >
                  {job.client}
                </span>
              ))}
              {load.jobs.length > 2 ? <span className="px-1.5 text-[11px] font-bold text-muted">+{load.jobs.length - 2}</span> : null}
              {load.proposals.map((proposal) => (
                <span key={proposal.id} className="block truncate rounded-md border border-dashed border-field-border px-1.5 py-px text-[11px] text-muted">
                  ? {proposal.client}
                </span>
              ))}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-start gap-x-6 gap-y-3.5 rounded-[18px] border border-line bg-surface-soft px-4.5 py-4">
        <div className="flex min-w-70 flex-[1_1_280px] flex-col gap-2.5">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <strong className="font-display text-[22px] font-extrabold">{selectedTitle}</strong>
            <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold ${LEVEL_PILL[sel.level]}`}>{m.levels[sel.level]}</span>
          </div>
          {sel.over ? (
            <span className="rounded-xl border border-warn-border bg-warn-surface px-3 py-2.5 text-[13px] font-bold text-warn-foreground">
              {interpolate(m.over, { needed: sel.people, have: overview.people.length })}
            </span>
          ) : null}
          {sel.jobs.length === 0 && sel.proposals.length === 0 ? <span className="text-sm text-muted">{m.empty}</span> : null}
          <ul className="flex flex-col gap-1.5">
            {sel.jobs.map((job) => {
              const issues = describeIssues(issuesOf(job, overview.vehicles), t, lang);
              const row = "flex w-full items-center gap-2.5 rounded-xl border border-line-soft bg-surface px-3 py-2 text-left";
              const body = (
                <>
                  <span className="font-mono text-xs font-bold text-muted">{job.id}</span>
                  <strong className="flex-1 text-sm">{job.client}</strong>
                  <span className="text-xs text-muted">{pluralize(lang, Math.max(job.crewNeeded, job.crewIds.length), m.people)}</span>
                  <span
                    className={`inline-flex h-5.5 items-center rounded-full px-2 text-[11px] font-bold whitespace-nowrap ${issues ? "bg-warn-surface text-warn-foreground" : "bg-info-surface text-foreground"}`}
                  >
                    {issues || m.tagAccepted}
                  </span>
                </>
              );
              return (
                <li key={job.id}>
                  {job.detail ? (
                    <Link href={scheduleHref(lang, { view: "month", date, show, day: selected, job: job.id })} scroll={false} className={`${row} ${focusRing}`}>
                      {body}
                    </Link>
                  ) : (
                    <span className={row}>{body}</span>
                  )}
                </li>
              );
            })}
            {sel.proposals.map((proposal) => (
              <li key={proposal.id} className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-status-off-border bg-surface px-3 py-2">
                <span className="font-mono text-xs font-bold text-muted">{proposal.id}</span>
                <strong className="flex-1 text-sm">{proposal.client}</strong>
                <span className="text-xs text-muted">{pluralize(lang, proposal.crewNeeded, m.people)}</span>
                <span className="inline-flex h-5.5 items-center rounded-full border border-dashed border-field-border px-2 text-[11px] font-bold whitespace-nowrap text-muted">
                  {m.pending}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex min-w-60 flex-[0_1_260px] flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted">{m.freeTitle}</span>
          <span className="flex gap-2">
            <span className="flex flex-1 flex-col rounded-[14px] bg-surface px-3 py-2.5">
              <strong className="font-display text-[22px]">{sel.freeVehicles}</strong>
              <span className="text-xs text-muted">{interpolate(m.ofVehicles, { count: overview.vehicles.length })}</span>
            </span>
            <span className="flex flex-1 flex-col rounded-[14px] bg-surface px-3 py-2.5">
              <strong className={`font-display text-[22px] ${sel.freePeople === 0 ? "text-warn-foreground" : ""}`}>{sel.freePeople}</strong>
              <span className="text-xs text-muted">{interpolate(m.ofPeople, { count: overview.people.length })}</span>
            </span>
          </span>
          <span className="text-xs leading-snug text-muted">
            {sel.proposals.length > 0
              ? interpolate(m.hintProposals, { count: sel.proposals.reduce((sum, p) => sum + p.crewNeeded, 0) })
              : sel.jobs.length > 0
                ? m.hintJobs
                : m.hintFree}
          </span>
          <Link
            href={scheduleHref(lang, { view: "week", date: selected, show })}
            scroll={false}
            className={`inline-flex h-9.5 w-fit items-center rounded-full border border-field-border bg-surface px-4 text-[13px] font-bold text-foreground ${focusRing}`}
          >
            {m.viewWeek}
          </Link>
        </div>
      </div>
    </section>
  );
}

