import type { FleetMetrics, Vehicle, VehicleJob } from "./types";

// Reglas de la lista de frota: estado, filtros, orden y avisos. Lógica pura, sin React ni Next.

export const FILTERS = ["all", "free", "busy", "idle"] as const;
export type FleetFilter = (typeof FILTERS)[number];
export const DEFAULT_FILTER: FleetFilter = "all";

export const SORTS = ["capacity", "lastUse", "nextUse", "proposals"] as const;
export type FleetSort = (typeof SORTS)[number];
export const DEFAULT_SORT: FleetSort = "capacity";

export const VIEWS = ["list", "cards"] as const;
export type FleetView = (typeof VIEWS)[number];
export const DEFAULT_VIEW: FleetView = "list";

/** Un vehículo activo sin salir tantos días se considera parado (provisional). */
export const IDLE_DAYS = 14;

export const isFilter = (value: string | undefined): value is FleetFilter => FILTERS.some((f) => f === value);
export const isSort = (value: string | undefined): value is FleetSort => SORTS.some((s) => s === value);
export const isView = (value: string | undefined): value is FleetView => VIEWS.some((v) => v === value);

const DAY_MS = 86_400_000;
const toTime = (day: string) => Date.parse(`${day}T12:00:00Z`);

/** Días entre dos fechas aaaa-mm-dd (positivo si `to` es posterior). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toTime(to) - toTime(from)) / DAY_MS);
}

/** Suma días a una fecha aaaa-mm-dd. */
export function addDays(day: string, days: number): string {
  return new Date(toTime(day) + days * DAY_MS).toISOString().slice(0, 10);
}

export type VehicleState = "busy" | "free" | "inactive";

export function stateOf(vehicle: Vehicle): VehicleState {
  return vehicle.active ? vehicle.live.kind : "inactive";
}

/** Días desde la última salida, o `null` si el vehículo aún no ha salido. */
export function daysSinceLastUse(vehicle: Vehicle, today: string): number | null {
  return vehicle.lastUseOn === null ? null : Math.max(daysBetween(vehicle.lastUseOn, today), 0);
}

export function isIdle(vehicle: Vehicle, today: string): boolean {
  const days = daysSinceLastUse(vehicle, today);
  return vehicle.active && days !== null && days >= IDLE_DAYS;
}

/** Primer trabajo marcado después de hoy. */
export function nextJob(vehicle: Vehicle, today: string): VehicleJob | undefined {
  return vehicle.jobs.find((job) => job.date > today);
}

export type FleetSummary = { capacityM3: number; busy: number; free: number; inactive: number };

export function summarize(vehicles: readonly Vehicle[]): FleetSummary {
  const active = vehicles.filter((v) => v.active);
  return {
    capacityM3: active.reduce((sum, v) => sum + v.capacityM3, 0),
    busy: active.filter((v) => v.live.kind === "busy").length,
    free: active.filter((v) => v.live.kind === "free").length,
    inactive: vehicles.length - active.length,
  };
}

export function countByFilter(vehicles: readonly Vehicle[], today: string): Record<FleetFilter, number> {
  const active = vehicles.filter((v) => v.active);
  return {
    all: active.length,
    free: active.filter((v) => v.live.kind === "free").length,
    busy: active.filter((v) => v.live.kind === "busy").length,
    idle: active.filter((v) => isIdle(v, today)).length,
  };
}

/** Minúsculas y sin tildes ni guiones, para buscar por nombre o matrícula ("aa12bc"). */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s-]/g, "")
    .toLowerCase();
}

function matches(vehicle: Vehicle, filter: FleetFilter, today: string): boolean {
  if (filter === "free") return vehicle.live.kind === "free";
  if (filter === "busy") return vehicle.live.kind === "busy";
  if (filter === "idle") return isIdle(vehicle, today);
  return true;
}

function compare(sort: FleetSort, today: string): (a: Vehicle, b: Vehicle) => number {
  // Sin próximo trabajo, al final
  const nextOf = (v: Vehicle) => {
    const job = nextJob(v, today);
    return job ? `${job.date}T${job.start}` : "9999";
  };
  switch (sort) {
    case "capacity":
      return (a, b) => b.capacityM3 - a.capacityM3;
    case "lastUse":
      return (a, b) => (b.lastUseOn ?? "").localeCompare(a.lastUseOn ?? "");
    case "nextUse":
      return (a, b) => nextOf(a).localeCompare(nextOf(b));
    case "proposals":
      return (a, b) => b.proposals30d.total - a.proposals30d.total;
  }
}

export type FleetQuery = { filter: FleetFilter; q: string; sort: FleetSort };

/**
 * Activos filtrados y ordenados, y aparte los inactivos (siempre visibles, solo les afecta la búsqueda).
 * `all` es el orden de navegación del panel: activos y después inactivos.
 */
export function arrangeFleet(vehicles: readonly Vehicle[], { filter, q, sort }: FleetQuery, today: string) {
  const needle = normalize(q);
  const found = (v: Vehicle) => needle === "" || normalize(`${v.name}${v.plate}`).includes(needle);
  const order = compare(sort, today);

  const active = vehicles.filter((v) => v.active && found(v) && matches(v, filter, today)).sort(order);
  const inactive = vehicles.filter((v) => !v.active && found(v)).sort(order);
  return { active, inactive, all: [...active, ...inactive] };
}

export type FleetAlerts = {
  extraTripProposals: number;
  /** El vehículo activo que lleva más tiempo parado. */
  idle: { vehicle: Vehicle; days: number } | null;
  /** Vehículos activos sin coste por km. */
  missingCost: { count: number; first: Vehicle } | null;
};

export function fleetAlerts(vehicles: readonly Vehicle[], metrics: FleetMetrics, today: string): FleetAlerts {
  const idle = vehicles
    .filter((v) => isIdle(v, today))
    .map((vehicle) => ({ vehicle, days: daysSinceLastUse(vehicle, today) ?? 0 }))
    .sort((a, b) => b.days - a.days)[0];
  const missing = vehicles.filter((v) => v.active && v.costMissing);
  return {
    extraTripProposals: metrics.extraTripProposals,
    idle: idle ?? null,
    missingCost: missing[0] ? { count: missing.length, first: missing[0] } : null,
  };
}

/** Porcentaje de propostas aceptadas, o `null` si no hubo ninguna. */
export function acceptanceRate(vehicle: Vehicle): number | null {
  const { total, accepted } = vehicle.proposals30d;
  return total > 0 ? accepted / total : null;
}
