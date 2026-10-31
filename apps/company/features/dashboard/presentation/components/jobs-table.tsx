import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { Job, JobStatus } from "@/features/dashboard/domain/types";
import { describeCrew, describeJobKind, describeJobStatus, describeVolume, type HomeText } from "../home-text";

const PILL: Record<JobStatus, string> = {
  "in-progress": "bg-warn-surface text-warn-foreground",
  scheduled: "bg-foreground text-background",
  done: "bg-success-surface text-success-foreground",
  unassigned: "bg-line-soft text-muted",
};
const DOT: Record<JobStatus, string> = {
  "in-progress": "bg-primary",
  scheduled: "bg-foreground",
  done: "bg-success-dot",
  unassigned: "bg-accent",
};

// Plantilla de columnas (estática para que Tailwind la genere)
const COLS =
  "grid-cols-[minmax(112px,0.8fr)_minmax(130px,1.1fr)_minmax(140px,1.4fr)_minmax(115px,0.9fr)_minmax(120px,1fr)_minmax(52px,0.5fr)_44px]";
const cell = "flex min-w-0 flex-col gap-1 px-2.5";

export function JobsTable({ lang, t, jobs }: { lang: Locale; t: HomeText; jobs: readonly Job[] }) {
  const { jobs: j } = t;
  const head = [j.columns.id, j.columns.client, j.columns.route, j.columns.status, j.columns.vehicle, j.columns.time];

  return (
    <section aria-labelledby="jobs" className="rounded-3xl border border-line bg-surface px-2 pt-5 pb-3">
      <div className="mb-3 flex items-center justify-between gap-3 px-4">
        <h2 id="jobs" className="font-display text-[22px] font-extrabold">
          {j.title}
        </h2>
        <Link
          href={localePath(lang, ROUTES.schedule)}
          className="text-[13px] font-bold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {j.viewSchedule}
        </Link>
      </div>
      <div className="overflow-x-auto">
        <div role="table" aria-labelledby="jobs" className="min-w-178">
          <div role="row" className={`mb-1 grid items-center border-b border-line-soft ${COLS}`}>
            {head.map((label, index) => (
              <span
                key={label}
                role="columnheader"
                className={`px-2.5 py-3 text-[11px] leading-tight font-bold uppercase tracking-[0.12em] text-muted ${index === 0 ? "pl-3" : ""}`}
              >
                {label}
              </span>
            ))}
            <span role="columnheader">
              <span className="sr-only">{j.columns.open}</span>
            </span>
          </div>

          {jobs.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">{j.empty}</p> : null}
          {jobs.map((job) => (
            <div key={job.id} role="row" className={`grid min-h-16 items-center rounded-2xl hover:bg-surface-soft ${COLS}`}>
              <div role="cell" className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold whitespace-nowrap">
                <span aria-hidden className={`size-2.25 flex-none rounded-full ${DOT[job.status]}`} />
                {job.id}
              </div>
              <div role="cell" className={cell}>
                <span className="font-bold">{job.client}</span>
                <span className="text-xs text-muted">{describeJobKind(job, t)}</span>
              </div>
              <div role="cell" className={cell}>
                <span className="text-sm font-medium">
                  {job.from} <span aria-hidden="true">→</span>
                  <span className="sr-only">{j.routeTo}</span> {job.to}
                </span>
                <span className="text-xs text-muted">{describeVolume(job, t, lang)}</span>
              </div>
              <div role="cell" className={cell}>
                <span
                  className={`inline-flex h-6.5 items-center self-start whitespace-nowrap rounded-full px-2.5 text-xs font-bold ${PILL[job.status]}`}
                >
                  {describeJobStatus(job, t)}
                </span>
              </div>
              <div role="cell" className={cell}>
                <span className="text-sm font-medium">{job.vehicle ?? j.noVehicle}</span>
                <span className="text-xs text-muted">{describeCrew(job.crewCount, t, lang)}</span>
              </div>
              <div role="cell" className="px-2.5 text-sm font-bold whitespace-nowrap">
                {job.time ?? "—"}
              </div>
              <div role="cell">
                <Link
                  href={localePath(lang, ROUTES.jobs.detail(job.id))}
                  aria-label={interpolate(j.openJob, { id: job.id })}
                  className="mx-1 grid size-9 place-items-center rounded-full border border-status-off-border bg-surface text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Icon name="chevronRight" size={16} strokeWidth={2.4} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
