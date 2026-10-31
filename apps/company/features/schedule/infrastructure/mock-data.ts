import { addDays } from "@/features/fleet/domain/fleet";
import type { Access, HistoryEvent, JobDetail, JobStatus, PendingProposal, Person, ScheduleJob, Vehicle } from "../domain/types";

// Datos de ejemplo de la agenda. Se sustituyen por consultas a Supabase (RLS por company_id, RNF-01).
// Las fechas son relativas a hoy (el prototipo vive el viernes: ayer cerrado, hoy en curso, mañana programado).
// Clientes, direcciones y nombres de vehículos son datos de la empresa. Las personas y los vehículos coinciden con Equipa y Frota.

export const VEHICLES: Vehicle[] = [
  { id: "cg", name: "Camião grande", capacityM3: 25 },
  { id: "cm", name: "Camião médio", capacityM3: 20 },
  { id: "v2", name: "Furgão V-02", capacityM3: 15 },
  { id: "v1", name: "Furgão V-01", capacityM3: 12 },
  { id: "v3", name: "Furgão V-03", capacityM3: 8 },
];

export const PEOPLE: Person[] = [
  { id: "rui", name: "Rui Santos", position: "foreman" },
  { id: "paulo", name: "Paulo Ferreira", position: "loader" },
  { id: "andre", name: "André Lopes", position: "driver" },
  { id: "tiago", name: "Tiago Marques", position: "loader" },
  { id: "bruno", name: "Bruno Costa", position: "driver" },
  { id: "marco", name: "Marco Ribeiro", position: "loader" },
  { id: "hugo", name: "Hugo Almeida", position: "loader" },
];

type JobSeed = {
  id: string;
  client: string;
  /** Días desde hoy. */
  day: number;
  start: string;
  end: string;
  from: string;
  to: string;
  vehicleId: string | null;
  crewIds: string[];
  crewNeeded: number;
  status: JobStatus;
  volumeM3: number;
  detail?: DetailSeed;
};

type MomentSeed = { day: number; time?: string };
type HistorySeed =
  | { kind: "closed" | "delivery-signed" | "crew-assigned" | "permit-granted" | "job-started"; at: MomentSeed; by: string }
  | { kind: "pickup-signed"; at: MomentSeed; by?: string }
  | { kind: "quote-accepted"; at: MomentSeed }
  | { kind: "crew-named"; at: MomentSeed; by: string; personIds: string[] };

type DetailSeed = Omit<JobDetail, "history" | "permit" | "closed" | "acceptedOn" | "clientPhone"> & {
  history: HistorySeed[];
  permit?: { place: string; grantedDay: number };
  closed?: MomentSeed & { by: string };
  acceptedDay: number;
};

const acc = (floor: Access["floor"], elevator: Access["elevator"], parking: Access["parking"]): Access => ({ floor, elevator, parking });
const door = { kind: "door" } as const;

const SEEDS: JobSeed[] = [
  {
    id: "MD-0815", client: "Joana Freitas", day: -4, start: "08:00", end: "13:00", from: "Arroios", to: "Graça", vehicleId: "v2", crewIds: ["andre", "tiago"], crewNeeded: 2, status: "closed", volumeM3: 11.4,
    detail: {
      acceptedDay: -11, estimate: { hours: 5, km: 14 }, actual: { hours: 5.5, km: 16 }, priceCents: 45_500, closed: { day: -3, by: "Gema" },
      addresses: [{ kind: "origin", place: "Arroios", access: acc(2, "normal", door) }, { kind: "destination", place: "Graça", access: acc(3, "none", { kind: "walk", meters: 40 }) }],
      history: [{ kind: "closed", at: { day: -3 }, by: "Gema" }, { kind: "delivery-signed", at: { day: -4, time: "13:20" }, by: "André" }, { kind: "quote-accepted", at: { day: -11 } }],
    },
  },
  {
    id: "MD-0816", client: "Pedro Antunes", day: -3, start: "08:00", end: "15:00", from: "Sintra", to: "Cascais", vehicleId: "cg", crewIds: ["rui", "paulo", "marco"], crewNeeded: 3, status: "closed", volumeM3: 22,
    detail: {
      acceptedDay: -14, estimate: { hours: 7, km: 48 }, actual: { hours: 7.5, km: 51 }, priceCents: 131_000, closed: { day: -2, by: "Gema" },
      addresses: [{ kind: "origin", place: "Sintra", access: acc("house", null, door) }, { kind: "destination", place: "Cascais", access: acc(1, "normal", door) }],
      history: [{ kind: "closed", at: { day: -2 }, by: "Gema" }, { kind: "quote-accepted", at: { day: -14 } }],
    },
  },
  {
    id: "MD-0817", client: "Ana Costa", day: -2, start: "09:00", end: "14:00", from: "Amadora", to: "Benfica", vehicleId: "v1", crewIds: ["bruno", "marco"], crewNeeded: 2, status: "delivered", volumeM3: 9.8,
    detail: {
      acceptedDay: -9, estimate: { hours: 5, km: 16 }, deliveredAt: "13:50",
      addresses: [{ kind: "origin", place: "Amadora", access: acc(1, "none", door) }, { kind: "destination", place: "Benfica", access: acc(5, "normal", { kind: "walk", meters: 20 }) }],
      history: [{ kind: "delivery-signed", at: { day: -2, time: "13:50" }, by: "Bruno" }, { kind: "pickup-signed", at: { day: -2, time: "10:05" }, by: "Bruno" }, { kind: "quote-accepted", at: { day: -9 } }],
    },
  },
  {
    id: "MD-0818", client: "Miguel Sousa", day: -1, start: "08:00", end: "12:00", from: "Oeiras", to: "Carcavelos", vehicleId: "v2", crewIds: ["andre", "tiago"], crewNeeded: 2, status: "closed", volumeM3: 8.6,
    detail: {
      acceptedDay: -10, estimate: { hours: 4, km: 12 }, actual: { hours: 3.8, km: 12 }, priceCents: 39_500, closed: { day: -1, by: "Gema" },
      addresses: [{ kind: "origin", place: "Oeiras", access: acc(4, "small", door) }, { kind: "destination", place: "Carcavelos", access: acc("ground", null, door) }],
      history: [{ kind: "closed", at: { day: -1 }, by: "Gema" }, { kind: "quote-accepted", at: { day: -10 } }],
    },
  },
  {
    id: "MD-0819", client: "Beatriz Nunes", day: 0, start: "07:00", end: "11:15", from: "Alvalade", to: "Lumiar", vehicleId: "v1", crewIds: ["bruno"], crewNeeded: 1, status: "delivered", volumeM3: 4.2,
    detail: {
      acceptedDay: -6, estimate: { hours: 4, km: 9 }, deliveredAt: "11:15",
      addresses: [{ kind: "origin", place: "Alvalade", access: acc(2, "small", door) }, { kind: "destination", place: "Lumiar", access: acc(1, "normal", door) }],
      history: [{ kind: "delivery-signed", at: { day: 0, time: "11:15" }, by: "Bruno" }, { kind: "pickup-signed", at: { day: 0, time: "08:20" }, by: "Bruno" }, { kind: "quote-accepted", at: { day: -6 } }],
    },
  },
  {
    id: "MD-0821", client: "Família Moreira", day: 0, start: "08:00", end: "16:00", from: "Benfica", to: "Parque das Nações", vehicleId: "cg", crewIds: ["rui", "paulo"], crewNeeded: 2, status: "in-progress", volumeM3: 21.7,
    detail: {
      acceptedDay: -8, estimate: { hours: 8, km: 22 }, leadId: "rui",
      addresses: [{ kind: "origin", place: "Benfica", access: acc(3, "small", { kind: "walk", meters: 30 }) }, { kind: "destination", place: "Parque das Nações", access: acc(6, "normal", { kind: "garage" }) }],
      live: [
        { at: "08:05", kind: "left-base", withCrew: true },
        { at: "08:40", kind: "arrived-origin", photos: 14 },
        { at: "10:40", kind: "pickup-signed" },
        { at: "11:20", kind: "incident", note: "Risco na cómoda · sem custo · aberta" },
        { at: "now", kind: "unloading", endsAt: "16:00" },
      ],
      history: [{ kind: "pickup-signed", at: { day: 0, time: "10:40" } }, { kind: "crew-assigned", at: { day: -3 }, by: "Gema" }, { kind: "quote-accepted", at: { day: -8 } }],
    },
  },
  {
    id: "MD-0824", client: "TechHub Ibéria", day: 0, start: "14:00", end: "18:00", from: "Lisboa", to: "Oeiras", vehicleId: "v2", crewIds: ["andre", "tiago"], crewNeeded: 2, status: "in-progress", volumeM3: 12.9,
    detail: {
      acceptedDay: -10, estimate: { hours: 4, km: 18 }, leadId: "andre",
      addresses: [{ kind: "origin", place: "Lisboa (escritório)", access: acc(2, "cargo", { kind: "dock" }) }, { kind: "destination", place: "Oeiras", access: acc(1, "normal", door) }],
      live: [{ at: "14:05", kind: "arrived-origin", withCrew: true }, { at: "now", kind: "loading", photos: 6 }],
      history: [{ kind: "job-started", at: { day: 0, time: "14:05" }, by: "André" }, { kind: "quote-accepted", at: { day: -10 } }],
    },
  },
  {
    id: "MD-0838", client: "Rita Gomes", day: 1, start: "08:00", end: "14:00", from: "Penha de França", to: "Olivais", vehicleId: "v1", crewIds: ["bruno", "marco"], crewNeeded: 3, status: "scheduled", volumeM3: 11.2,
    detail: {
      acceptedDay: -3, estimate: { hours: 6, km: 10 },
      addresses: [{ kind: "origin", place: "Penha de França", access: acc(3, "none", door) }, { kind: "destination", place: "Olivais", access: acc(1, "small", { kind: "walk", meters: 30 }) }],
      history: [{ kind: "crew-named", at: { day: -3 }, by: "Gema", personIds: ["bruno", "marco"] }, { kind: "quote-accepted", at: { day: -3 } }],
    },
  },
  {
    id: "MD-0840", client: "Luís Pereira", day: 1, start: "09:00", end: "13:00", from: "Odivelas", to: "Loures", vehicleId: "cg", crewIds: ["rui", "paulo"], crewNeeded: 2, status: "scheduled", volumeM3: 16.4,
    detail: {
      acceptedDay: -4, estimate: { hours: 4, km: 12 }, permit: { place: "Odivelas", grantedDay: -2 },
      addresses: [{ kind: "origin", place: "Odivelas", access: acc(4, "normal", { kind: "permit" }) }, { kind: "destination", place: "Loures", access: acc("house", null, door) }],
      history: [{ kind: "permit-granted", at: { day: -2 }, by: "Gema" }, { kind: "crew-assigned", at: { day: -4 }, by: "Gema" }, { kind: "quote-accepted", at: { day: -4 } }],
    },
  },
  {
    id: "MD-0846", client: "Sofia Lima", day: 7, start: "08:00", end: "13:00", from: "Campo de Ourique", to: "Estrela", vehicleId: null, crewIds: [], crewNeeded: 3, status: "scheduled", volumeM3: 18.5,
    detail: {
      acceptedDay: -1, estimate: { hours: 5, km: 8 },
      addresses: [{ kind: "origin", place: "Campo de Ourique", access: acc(2, "small", door) }, { kind: "destination", place: "Estrela", access: acc(3, "none", { kind: "walk", meters: 20 }) }],
      history: [{ kind: "quote-accepted", at: { day: -1, time: "18:42" } }],
    },
  },
];

/** Mudanças aceptadas más lejanas: solo cuentan para la carga del mes (no abren panel). */
const LIGHT: { id: string; client: string; day: number; need: number; vehicleId?: string | null; crewShort?: number }[] = [
  { id: "MD-0841", client: "Nuno Teixeira", day: 3, need: 2 },
  { id: "MD-0827", client: "Escritórios Delta", day: 4, need: 3 },
  { id: "MD-0844", client: "Carlos Mota", day: 5, need: 2 },
  { id: "MD-0830", client: "Carla Mendes", day: 6, need: 2, vehicleId: "v3", crewShort: 1 },
  { id: "MD-0843", client: "Inês Rocha", day: 6, need: 2 },
  { id: "MD-0848", client: "Marta Duarte", day: 11, need: 2 },
  { id: "MD-0850", client: "Ricardo Pinto", day: 13, need: 3 },
  { id: "MD-0849", client: "Helena Sá", day: 15, need: 2 },
  { id: "MD-0851", client: "Grupo Vértice", day: 15, need: 3 },
  { id: "MD-0853", client: "Tomás Reis", day: 20, need: 2 },
  { id: "MD-0854", client: "Filipa Matos", day: 22, need: 3 },
  { id: "MD-0855", client: "Catarina Lobo", day: 28, need: 2 },
  { id: "MD-0856", client: "Jorge Faria", day: 28, need: 3 },
  { id: "MD-0857", client: "Nuno Alves", day: 29, need: 3 },
  { id: "MD-0858", client: "Sara Pinho", day: 29, need: 2 },
  { id: "MD-0859", client: "Escola Aurora", day: 29, need: 3 },
  { id: "MD-0860", client: "Rui Matias", day: 31, need: 2 },
];

const PROPOSALS: { id: string; client: string; day: number; need: number }[] = [
  { id: "MD-0826", client: "TechHub Ibéria", day: 8, need: 2 },
  { id: "MD-0852", client: "Paulo Reis", day: 15, need: 2 },
  { id: "MD-0861", client: "Leonor Cruz", day: 31, need: 2 },
];

const moment = (today: string, { day, time }: MomentSeed) => ({ date: addDays(today, day), ...(time ? { time } : {}) });

function toHistory(today: string, seed: HistorySeed): HistoryEvent {
  return { ...seed, at: moment(today, seed.at) } as HistoryEvent;
}

function toDetail(today: string, id: string, { history, permit, closed, acceptedDay, ...rest }: DetailSeed): JobDetail {
  return {
    ...rest,
    clientPhone: `+351912${id.replace(/\D/g, "").padStart(6, "0")}`,
    acceptedOn: addDays(today, acceptedDay),
    permit: permit ? { place: permit.place, grantedOn: addDays(today, permit.grantedDay) } : undefined,
    closed: closed ? { ...moment(today, closed), by: closed.by } : undefined,
    history: history.map((event) => toHistory(today, event)),
  };
}

export function mockJobs(today: string): ScheduleJob[] {
  const detailed: ScheduleJob[] = SEEDS.map(({ day, detail, ...job }) => ({
    ...job,
    date: addDays(today, day),
    detail: detail ? toDetail(today, job.id, detail) : undefined,
  }));
  const light: ScheduleJob[] = LIGHT.map(({ id, client, day, need, vehicleId, crewShort = 0 }) => ({
    id,
    client,
    date: addDays(today, day),
    start: "08:00",
    end: "13:00",
    from: "Lisboa",
    to: "Lisboa",
    // Sin incidencias por defecto: el vehículo grande y la equipa completa
    vehicleId: vehicleId === undefined ? (need >= 3 ? "cg" : "v2") : vehicleId,
    crewIds: PEOPLE.slice(0, Math.max(0, need - crewShort)).map((p) => p.id),
    crewNeeded: need,
    status: "scheduled" as const,
    volumeM3: need * 4,
  }));
  return [...detailed, ...light];
}

export function mockProposals(today: string): PendingProposal[] {
  return PROPOSALS.map(({ id, client, day, need }) => ({ id, client, date: addDays(today, day), crewNeeded: need }));
}

