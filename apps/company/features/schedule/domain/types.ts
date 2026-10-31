import type { Position } from "@/features/team/domain/types";

// Entidades de la agenda (P10). Fechas ISO (aaaa-mm-dd), horas hh:mm de Lisboa, importes en céntimos.
// Los textos que ve la persona salen de códigos y valores: la interfaz los traduce. Nombres de clientes, direcciones
// y vehículos son datos de la empresa y no se traducen.

export type Vehicle = { id: string; name: string; capacityM3: number };
export type Person = { id: string; name: string; position: Position };

export type JobStatus = "scheduled" | "in-progress" | "delivered" | "closed";

/** Cómo se llega a una dirección: piso, ascensor y dónde se aparca. */
export type Access = {
  floor: "house" | "ground" | number;
  elevator: "none" | "small" | "normal" | "cargo" | null;
  parking: { kind: "door" | "garage" | "dock" | "permit" } | { kind: "walk"; meters: number };
};

export type JobAddress = { kind: "origin" | "destination"; place: string; access: Access };

/** Cuándo pasó algo. Sin hora, solo el día. */
export type Moment = { date: string; time?: string };

export type HistoryEvent =
  | { kind: "closed"; at: Moment; by: string }
  | { kind: "delivery-signed"; at: Moment; by: string }
  | { kind: "pickup-signed"; at: Moment; by?: string }
  | { kind: "quote-accepted"; at: Moment }
  | { kind: "crew-assigned"; at: Moment; by: string }
  | { kind: "crew-named"; at: Moment; by: string; personIds: string[] }
  | { kind: "permit-granted"; at: Moment; by: string }
  | { kind: "job-started"; at: Moment; by: string };

/** Hito de un trabajo en curso. `now` es el punto en que va ahora mismo. */
export type LiveEvent = {
  /** hh:mm, o "now" para lo que está pasando. */
  at: string;
  kind: "left-base" | "arrived-origin" | "pickup-signed" | "incident" | "unloading" | "loading";
  /** Solo "left-base" y "arrived-origin" cuando se indica el equipo. */
  withCrew?: boolean;
  photos?: number;
  /** Texto de la incidencia (escrito por la empresa). */
  note?: string;
  endsAt?: string;
};

export type JobDetail = {
  addresses: JobAddress[];
  history: HistoryEvent[];
  /** Jefe de equipo de un trabajo en curso. */
  leadId?: string;
  live?: LiveEvent[];
  /** Licencia de estacionamiento tratada, con el lugar. */
  permit?: { place: string; grantedOn: string };
  /** Entregado (hh:mm). */
  deliveredAt?: string;
  estimate: { hours: number; km: number };
  actual?: { hours: number; km: number };
  priceCents?: number;
  /** Cierre del trabajo. */
  closed?: Moment & { by: string };
  /** Día en que se aceptó la propuesta, para los avisos ("aceite ontem"). */
  acceptedOn: string;
  /** Teléfono del cliente, normalizado (+351…). */
  clientPhone: string;
};

export type ScheduleJob = {
  id: string;
  client: string;
  date: string;
  start: string;
  end: string;
  from: string;
  to: string;
  vehicleId: string | null;
  crewIds: string[];
  /** Personas que la proposta cuenta para este trabajo. */
  crewNeeded: number;
  status: JobStatus;
  volumeM3: number;
  /** Solo los trabajos con ficha completa abren el panel. */
  detail?: JobDetail;
};

/** Proposta enviada y a la espera: cuenta como una posible carga más en el mes. */
export type PendingProposal = { id: string; client: string; date: string; crewNeeded: number };

export type ScheduleOverview = {
  vehicles: Vehicle[];
  people: Person[];
  jobs: ScheduleJob[];
  proposals: PendingProposal[];
};
