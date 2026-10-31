import { addDays, daysBetween } from "@/features/fleet/domain/fleet";
import type { PendingProposal, Person, ScheduleJob, ScheduleOverview, Vehicle } from "./types";

// Reglas de la agenda: fechas, semana, mes, carga de cada día, recursos que faltan y avisos. Lógica pura.

export const VIEWS = ["day", "week", "month"] as const;
export type ScheduleView = (typeof VIEWS)[number];
export const DEFAULT_VIEW: ScheduleView = "week";
export const isView = (value: string | undefined): value is ScheduleView => VIEWS.some((v) => v === value);

/** Qué trabajos se muestran: todos, los que aún no tienen todo, o los de un vehículo o una persona. */
export type Show = { kind: "all" } | { kind: "unassigned" } | { kind: "vehicle"; id: string } | { kind: "person"; id: string };

export function parseShow(value: string | undefined): Show {
  if (value === "unassigned") return { kind: "unassigned" };
  const [kind, id] = (value ?? "").split(":");
  if (id && (kind === "vehicle" || kind === "person")) return { kind, id };
  return { kind: "all" };
}

export function showToParam(show: Show): string | undefined {
  return show.kind === "all" ? undefined : show.kind === "unassigned" ? "unassigned" : `${show.kind}:${show.id}`;
}

export const isIsoDate = (value: string | undefined): value is string => value !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));

export { addDays, daysBetween };

const at = (day: string) => new Date(`${day}T12:00:00Z`);

/** 0 = lunes … 6 = domingo. */
export const weekdayIndex = (day: string): number => (at(day).getUTCDay() + 6) % 7;

export const startOfWeek = (day: string): string => addDays(day, -weekdayIndex(day));

export function addMonths(day: string, months: number): string {
  const d = at(day);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1, 12));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), last));
  return target.toISOString().slice(0, 10);
}

export const monthOf = (day: string): string => day.slice(0, 7);

/** Las 6 semanas (42 días) que cubren el mes de `day`, empezando en lunes. */
export function monthGrid(day: string): string[] {
  const first = `${monthOf(day)}-01`;
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

/** "08:00" → 8; "11:15" → 11,25. */
export function toHours(time: string): number {
  const [h = "0", m = "0"] = time.split(":");
  return Number(h) + Number(m) / 60;
}

export const vehicleOf = (job: ScheduleJob, vehicles: readonly Vehicle[]): Vehicle | undefined =>
  vehicles.find((v) => v.id === job.vehicleId);

/** Personas y vehículo que faltan para que un trabajo programado esté listo. */
export function missingOf(job: ScheduleJob): { people: number; vehicle: boolean; total: number } {
  const people = Math.max(0, job.crewNeeded - job.crewIds.length);
  const vehicle = job.vehicleId === null;
  return { people, vehicle, total: people + (vehicle ? 1 : 0) };
}

/** Un trabajo programado al que aún le falta algo. */
export const lacksResources = (job: ScheduleJob): boolean => job.status === "scheduled" && missingOf(job).total > 0;

/** El vehículo asignado no llega al volumen del trabajo. */
export function vehicleTooSmall(job: ScheduleJob, vehicles: readonly Vehicle[]): boolean {
  const vehicle = vehicleOf(job, vehicles);
  return vehicle !== undefined && vehicle.capacityM3 < job.volumeM3;
}

/** Códigos de lo que falta o no encaja en un trabajo programado, para el mes y los avisos. */
export type Issue = { kind: "no-resources" } | { kind: "no-vehicle" } | { kind: "small-vehicle" } | { kind: "short-crew"; count: number };

export function issuesOf(job: ScheduleJob, vehicles: readonly Vehicle[]): Issue[] {
  if (job.status !== "scheduled") return [];
  const { people, vehicle } = missingOf(job);
  if (vehicle && job.crewIds.length === 0) return [{ kind: "no-resources" }];
  const issues: Issue[] = [];
  if (vehicle) issues.push({ kind: "no-vehicle" });
  else if (vehicleTooSmall(job, vehicles)) issues.push({ kind: "small-vehicle" });
  if (people > 0) issues.push({ kind: "short-crew", count: people });
  return issues;
}

export function filterJobs(jobs: readonly ScheduleJob[], show: Show): ScheduleJob[] {
  switch (show.kind) {
    case "all":
      return [...jobs];
    case "unassigned":
      return jobs.filter(lacksResources);
    case "vehicle":
      return jobs.filter((job) => job.vehicleId === show.id);
    case "person":
      return jobs.filter((job) => job.crewIds.includes(show.id));
  }
}

export const jobsOn = (jobs: readonly ScheduleJob[], day: string): ScheduleJob[] =>
  jobs.filter((job) => job.date === day).sort((a, b) => a.start.localeCompare(b.start));

export const proposalsOn = (proposals: readonly PendingProposal[], day: string): PendingProposal[] =>
  proposals.filter((p) => p.date === day);

// ---- Mes: disponibilidad -------------------------------------------------------------------

export const LEVELS = ["free", "room", "almost-full", "full"] as const;
export type Level = (typeof LEVELS)[number];

export type DayLoad = {
  jobs: ScheduleJob[];
  proposals: PendingProposal[];
  /** Personas que piden las mudanças aceptadas del día. */
  people: number;
  /** Proporción de la equipa ocupada (puede pasar de 1). */
  load: number;
  level: Level;
  /** Piden más gente de la que hay. */
  over: boolean;
  /** Trabajos con algo por resolver, más 1 si falta gente. */
  issues: number;
  freeVehicles: number;
  freePeople: number;
};

/** Cuánto pesa un día en recursos: estimado por las propostas aceptadas (las horas exactas están en Semana). */
export function dayLoad(day: string, overview: ScheduleOverview, jobs: readonly ScheduleJob[]): DayLoad {
  const dayJobs = jobsOn(jobs, day);
  const proposals = proposalsOn(overview.proposals, day);
  const total = overview.people.length;
  const people = dayJobs.reduce((sum, job) => sum + Math.max(job.crewNeeded, job.crewIds.length), 0);
  const load = total === 0 ? 0 : people / total;
  const level: Level = dayJobs.length === 0 ? "free" : load <= 0.5 ? "room" : load < 1 ? "almost-full" : "full";
  const over = people > total;
  const withIssues = dayJobs.filter((job) => issuesOf(job, overview.vehicles).length > 0).length;
  return {
    jobs: dayJobs,
    proposals,
    people,
    load,
    level,
    over,
    issues: withIssues + (over ? 1 : 0),
    freeVehicles: Math.max(0, overview.vehicles.length - dayJobs.length),
    freePeople: Math.max(0, total - people),
  };
}

// ---- Resumen, filtros y avisos -------------------------------------------------------------

export type ScheduleSummary = { week: number; inProgress: number; unassigned: number; toClose: number };

export function summarize(jobs: readonly ScheduleJob[], weekStart: string): ScheduleSummary {
  const weekEnd = addDays(weekStart, 6);
  return {
    week: jobs.filter((job) => job.date >= weekStart && job.date <= weekEnd).length,
    inProgress: jobs.filter((job) => job.status === "in-progress").length,
    unassigned: jobs.filter(lacksResources).length,
    toClose: jobs.filter((job) => job.status === "delivered").length,
  };
}

/** Personas sin ningún trabajo ese día (para sugerir a quién asignar). */
export function freePeopleOn(day: string, people: readonly Person[], jobs: readonly ScheduleJob[]): Person[] {
  const busy = new Set(jobsOn(jobs, day).flatMap((job) => job.crewIds));
  return people.filter((person) => !busy.has(person.id));
}

export type ScheduleAlerts = {
  /** El próximo trabajo con vehículo al que le falta gente. */
  shortCrew: { job: ScheduleJob; free: Person[] } | null;
  /** El próximo trabajo aceptado sin vehículo ni equipo. */
  noResources: ScheduleJob | null;
  /** El trabajo entregado más antiguo que falta cerrar. */
  toClose: ScheduleJob | null;
};

export function scheduleAlerts(overview: ScheduleOverview, today: string): ScheduleAlerts {
  const upcoming = overview.jobs.filter((job) => job.status === "scheduled" && job.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const short = upcoming.find((job) => job.vehicleId !== null && missingOf(job).people > 0);
  return {
    shortCrew: short ? { job: short, free: freePeopleOn(short.date, overview.people, overview.jobs) } : null,
    noResources: upcoming.find((job) => job.vehicleId === null && job.crewIds.length === 0) ?? null,
    toClose: overview.jobs.filter((job) => job.status === "delivered").sort((a, b) => a.date.localeCompare(b.date))[0] ?? null,
  };
}

/** Columna de cada trabajo cuando varios se solapan en el mismo día: se dibujan lado a lado. */
export function layoutOverlaps(dayJobs: readonly ScheduleJob[]): Map<string, { col: number; cols: number }> {
  const sorted = [...dayJobs].sort((a, b) => toHours(a.start) - toHours(b.start) || toHours(a.end) - toHours(b.end));
  const result = new Map<string, { col: number; cols: number }>();
  let cluster: { id: string; col: number }[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const member of cluster) result.set(member.id, { col: member.col, cols: columnEnds.length });
    cluster = [];
    columnEnds = [];
  };

  for (const job of sorted) {
    const start = toHours(job.start);
    if (cluster.length > 0 && start >= clusterEnd) flush();
    let col = columnEnds.findIndex((end) => end <= start);
    if (col === -1) col = columnEnds.length;
    columnEnds[col] = toHours(job.end);
    clusterEnd = Math.max(clusterEnd, toHours(job.end));
    cluster.push({ id: job.id, col });
  }
  flush();
  return result;
}
