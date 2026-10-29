import Link from "next/link";

import { Icon } from "@/app/components/icon";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { Job, JobStatus } from "@/features/dashboard/domain/types";

const PILL_BASE =
  "inline-flex h-7 items-center whitespace-nowrap rounded-full border px-3 text-[13px] font-bold";
const PILL: Record<JobStatus, string> = {
  "in-progress": "border-warn-border bg-warn-surface text-warn-foreground",
  scheduled: "border-primary-foreground bg-white text-primary-foreground",
  done: "border-success-border bg-success-surface text-success-foreground",
  unassigned: "border-status-off-border bg-line-soft text-muted",
};
const DOT: Record<JobStatus, string> = {
  "in-progress": "bg-primary",
  scheduled: "bg-foreground",
  done: "bg-success-dot",
  unassigned: "bg-accent",
};

const th = "px-3.5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted";
const td = "px-3.5 py-4";

export function JobsTable({ lang, jobs }: { lang: Locale; jobs: readonly Job[] }) {
  return (
    <section aria-labelledby="jobs" className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="jobs" className="font-display text-[22px] font-extrabold">
          Trabalhos de hoje
        </h2>
        <Link href={localePath(lang, ROUTES.schedule)} className="flex items-center gap-1.5 text-sm font-bold">
          Ver agenda
          <Icon name="arrowRight" size={16} />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-head text-left">
              <th scope="col" className={`${th} rounded-l-[10px]`}>ID</th>
              <th scope="col" className={th}>Cliente</th>
              <th scope="col" className={th}>Rota</th>
              <th scope="col" className={th}>Estado</th>
              <th scope="col" className={th}>Veículo e equipa</th>
              <th scope="col" className={th}>Hora prev.</th>
              <th scope="col" className="rounded-r-[10px] px-3.5 py-3">
                <span className="sr-only">Abrir</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-line-soft hover:bg-surface-soft">
                <td className={`${td} whitespace-nowrap`}>
                  <span className="inline-flex items-center gap-2.5 font-bold">
                    <span className={`size-[9px] rounded-full ${DOT[job.status]}`} />
                    {job.id}
                  </span>
                </td>
                <td className={td}>
                  <div className="font-bold">{job.client}</div>
                  <div className="text-[13px] text-muted">{job.kind}</div>
                </td>
                <td className={td}>
                  <div className="font-medium">
                    {job.from} <span aria-hidden="true">→</span>
                    <span className="sr-only">para</span> {job.to}
                  </div>
                  <div className="text-[13px] text-muted">{job.volume}</div>
                </td>
                <td className={td}>
                  <span className={`${PILL_BASE} ${PILL[job.status]}`}>{job.statusLabel}</span>
                </td>
                <td className={td}>
                  <div className="font-medium">{job.vehicle}</div>
                  <div className="text-[13px] text-muted">{job.crew}</div>
                </td>
                <td className={`${td} whitespace-nowrap font-bold`}>{job.time}</td>
                <td className="px-2 py-4 text-right">
                  <Link
                    href={localePath(lang, ROUTES.jobs.detail(job.id))}
                    aria-label={`Abrir trabalho ${job.id}`}
                    className="inline-grid size-9 place-items-center rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Icon name="chevronRight" size={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
