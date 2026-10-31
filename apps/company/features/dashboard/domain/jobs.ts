import type { Job, JobStatus } from "./types";

// Filtros de "Trabalhos de hoje": estado y texto. Lógica pura, sin React ni Next.

export const JOB_FILTERS = ["all", "in-progress", "scheduled", "done", "unassigned"] as const;
export type JobFilter = (typeof JOB_FILTERS)[number];
export const DEFAULT_JOB_FILTER: JobFilter = "all";

export const isJobFilter = (value: string | undefined): value is JobFilter => JOB_FILTERS.some((f) => f === value);

/** Minúsculas y sin tildes, espacios ni guiones, para buscar "md0821" o "familia". */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s-]/g, "")
    .toLowerCase();
}

export function countJobsByFilter(jobs: readonly Job[]): Record<JobFilter, number> {
  const of = (status: JobStatus) => jobs.filter((job) => job.status === status).length;
  return {
    all: jobs.length,
    "in-progress": of("in-progress"),
    scheduled: of("scheduled"),
    done: of("done"),
    unassigned: of("unassigned"),
  };
}

/** Filtra por estado y por texto (nº de trabajo, cliente o ruta). */
export function filterJobs(jobs: readonly Job[], filter: JobFilter, query: string): Job[] {
  const needle = normalize(query);
  return jobs.filter((job) => {
    if (filter !== "all" && job.status !== filter) return false;
    return needle === "" || normalize(`${job.id}${job.client}${job.from}${job.to}`).includes(needle);
  });
}
