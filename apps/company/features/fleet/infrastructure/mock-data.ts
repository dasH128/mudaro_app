import { addDays } from "../domain/fleet";
import type { FleetMetrics, Vehicle, VehicleChange, VehicleJob } from "../domain/types";

// Datos de ejemplo de la frota. Se sustituyen por consultas a Supabase.
// Las fechas son relativas a hoy para que "parado há 23 dias" o "próximo trabalho" no se desfasen con el tiempo.
// "Gema" es fija: saldrá del usuario de la sesión.

const BY = "Gema";

type JobSeed = Omit<VehicleJob, "date"> & { inDays: number };

type Seed = Omit<Vehicle, "jobs" | "lastUseOn" | "inactive" | "history" | "costMissing"> & {
  /** Hace cuántos días salió por última vez (0 = hoy). */
  lastUseDaysAgo: number;
  jobs: JobSeed[];
  inactive?: { reason: "workshop" | "other"; sinceDaysAgo: number };
  history: { daysAgo: number; event: VehicleChange }[];
};

const SEEDS: readonly Seed[] = [
  {
    id: "c25", name: "Camião grande", typeLabel: "Camião", kind: "truck", plate: "AA-12-BC",
    capacityM3: 25, maxLoadKg: 6000, costPerKmCents: 45, active: true,
    live: { kind: "busy", until: "16:00", orderId: "MD-0821" }, lastUseDaysAgo: 0,
    jobs: [
      { inDays: 0, start: "08:00", end: "16:00", orderId: "MD-0821", client: "Família Moreira", from: "Benfica", to: "Parque das Nações" },
      { inDays: 1, start: "09:00", end: "13:00", orderId: "MD-0840", client: "Luís Pereira", from: "Odivelas", to: "Loures" },
      { inDays: 4, start: "08:00", end: "15:00", orderId: "MD-0827", client: "Escritórios Delta", from: "Amadora", to: "Lisboa" },
    ],
    weekHours: [8, 4, 0, 0, 7, 0, 0], proposals30d: { total: 12, accepted: 7 }, usage: { jobs: 14, km: 612, hours: 96 },
    history: [
      { daysAgo: 18, event: { kind: "cost-changed", fromCents: 42, toCents: 45 } },
      { daysAgo: 59, event: { kind: "added", withoutCost: false } },
    ],
  },
  {
    id: "c20", name: "Camião médio", typeLabel: "Camião", kind: "truck", plate: "DJ-78-KL",
    capacityM3: 20, maxLoadKg: 3500, costPerKmCents: 38, active: true,
    live: { kind: "free" }, lastUseDaysAgo: 8,
    jobs: [{ inDays: 6, start: "08:00", end: "13:00", orderId: "MD-0830", client: "Carla Mendes", from: "Almada", to: "Seixal" }],
    weekHours: [0, 0, 0, 0, 0, 0, 5], proposals30d: { total: 6, accepted: 2 }, usage: { jobs: 7, km: 389, hours: 52 },
    history: [
      { daysAgo: 27, event: { kind: "max-load-changed", fromKg: 3200, toKg: 3500 } },
      { daysAgo: 59, event: { kind: "added", withoutCost: false } },
    ],
  },
  {
    id: "v02", name: "Furgão V-02", typeLabel: "Furgão", kind: "van", plate: "BD-34-EF",
    capacityM3: 15, maxLoadKg: 1400, costPerKmCents: 28, active: true,
    live: { kind: "busy", until: "18:00", orderId: "MD-0824" }, lastUseDaysAgo: 0,
    jobs: [
      { inDays: 0, start: "14:00", end: "18:00", orderId: "MD-0824", client: "TechHub Ibéria", from: "Lisboa", to: "Oeiras" },
      { inDays: 3, start: "08:30", end: "14:30", orderId: "MD-0841", client: "Nuno Teixeira", from: "Benfica", to: "Amadora" },
      { inDays: 6, start: "08:00", end: "13:00", orderId: "MD-0843", client: "Inês Rocha", from: "Lumiar", to: "Alvalade" },
    ],
    weekHours: [4, 0, 0, 6, 0, 0, 5], proposals30d: { total: 15, accepted: 8 }, usage: { jobs: 11, km: 438, hours: 71 },
    history: [{ daysAgo: 59, event: { kind: "added", withoutCost: false } }],
  },
  {
    id: "v01", name: "Furgão V-01", typeLabel: "Furgão", kind: "van", plate: "CG-56-HI",
    capacityM3: 12, maxLoadKg: 1200, costPerKmCents: 25, active: true,
    live: { kind: "free", returnedAt: "11:15" }, lastUseDaysAgo: 0,
    jobs: [
      { inDays: 1, start: "08:00", end: "14:00", orderId: "MD-0838", client: "Rita Gomes", from: "Penha de França", to: "Olivais" },
      { inDays: 5, start: "09:00", end: "13:00", orderId: "MD-0844", client: "Carlos Mota", from: "Algés", to: "Belém" },
    ],
    weekHours: [3, 6, 0, 0, 0, 4, 0], proposals30d: { total: 9, accepted: 6 }, usage: { jobs: 9, km: 205, hours: 48 },
    history: [{ daysAgo: 59, event: { kind: "added", withoutCost: false } }],
  },
  {
    id: "v03", name: "Furgão V-03", typeLabel: "Furgão pequeno", kind: "van", plate: "EM-90-NO",
    capacityM3: 8, maxLoadKg: 900, costPerKmCents: 0, active: true,
    live: { kind: "free" }, lastUseDaysAgo: 23,
    jobs: [],
    weekHours: [0, 0, 0, 0, 0, 0, 0], proposals30d: { total: 2, accepted: 1 }, usage: { jobs: 2, km: 41, hours: 9 },
    history: [{ daysAgo: 45, event: { kind: "added", withoutCost: true } }],
  },
  {
    id: "c18", name: "Camião antigo", typeLabel: "Camião", kind: "truck", plate: "FP-11-QR",
    capacityM3: 18, maxLoadKg: 3000, costPerKmCents: 40, active: false,
    inactive: { reason: "workshop", sinceDaysAgo: 10 },
    live: { kind: "free" }, lastUseDaysAgo: 13,
    jobs: [],
    weekHours: [0, 0, 0, 0, 0, 0, 0], proposals30d: { total: 0, accepted: 0 }, usage: { jobs: 3, km: 150, hours: 22 },
    history: [
      { daysAgo: 10, event: { kind: "deactivated", reason: "workshop" } },
      { daysAgo: 59, event: { kind: "added", withoutCost: false } },
    ],
  },
];

/** Vehículos de ejemplo con las fechas calculadas desde `today` (aaaa-mm-dd). */
export function mockVehicles(today: string): Vehicle[] {
  return SEEDS.map(({ lastUseDaysAgo, jobs, inactive, history, ...vehicle }) => ({
    ...vehicle,
    costMissing: !vehicle.costPerKmCents,
    lastUseOn: addDays(today, -lastUseDaysAgo),
    jobs: jobs.map(({ inDays, ...job }) => ({ ...job, date: addDays(today, inDays) })),
    inactive: inactive
      ? { reason: inactive.reason, since: addDays(today, -inactive.sinceDaysAgo), by: BY }
      : undefined,
    history: history.map(({ daysAgo, event }) => ({ ...event, at: addDays(today, -daysAgo), by: BY })),
  }));
}

export const MOCK_METRICS: FleetMetrics = { extraTripProposals: 4 };
