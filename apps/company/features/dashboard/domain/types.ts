// Entidades del panel "Operações de hoje". TypeScript puro: sin React, Next ni Supabase.
// Los textos que ve la persona salen de códigos y valores: la interfaz los traduce. Nombres de clientes, rutas
// y vehículos son datos de la empresa y no se traducen.

export type JobStatus = "in-progress" | "scheduled" | "done" | "unassigned";

/** En qué punto va un trabajo en curso. */
export type JobPhase = "loading" | "travelling" | "unloading";

export type JobKind = "full-move" | "office-transfer" | "private" | "office-material";

export type Job = {
  id: string;
  client: string;
  /** Tipo de mudança. `null` con datos reales: el pedido aún no guarda el tipo (paso 6.8). */
  kind: JobKind | null;
  /** "T3": solo en mudanças de vivienda. */
  typology: string | null;
  from: string;
  to: string;
  volumeM3: number;
  trips: number;
  status: JobStatus;
  /** Solo con el trabajo en curso. */
  phase: JobPhase | null;
  /** Nombre del vehículo (texto libre de la empresa); `null` si aún no hay. */
  vehicle: string | null;
  crewCount: number;
  /** Hora prevista hh:mm; `null` si aún no hay. */
  time: string | null;
};

export type Tone = "neutral" | "warn" | "success" | "danger";

/** Qué mide cada tarjeta. La interfaz decide el icono y el texto. */
export type StatKind = "jobs-today" | "in-progress" | "incidents";

export type Stat = {
  kind: StatKind;
  value: number;
  tone: Exclude<Tone, "neutral">;
  /** Diferencia con ayer (+1). */
  delta?: number;
};

export type StageKey = "new" | "link-sent" | "inventory-received" | "quote-sent" | "won";

export type Stage = {
  key: StageKey;
  count: number;
  tone: Exclude<Tone, "danger">;
};

export type ActivityTone = "primary" | "ink" | "success" | "danger";

export type ActivityEvent =
  | "arrived"
  | "crew-left"
  | "quote-accepted"
  | "delivery-done"
  | "incident-logged"
  // Eventos reales del historial de los envíos (paso 6.8)
  | "crew-assigned"
  | "pickup-done"
  | "incident-resolved"
  | "job-closed";

export type ActivityDetail =
  | { kind: "place"; place: string }
  | { kind: "crew"; vehicle: string; crewCount: number }
  | { kind: "signed" }
  /** Texto escrito por la empresa: no se traduce. */
  | { kind: "text"; text: string };

export type ActivityItem = {
  /** Único en la lista (el número del pedido se repite entre eventos). */
  id: string;
  time: string;
  tone: ActivityTone;
  ref: string;
  event: ActivityEvent;
  detail: ActivityDetail;
};

/** Incidencia abierta que pide la atención de la empresa. `reason` es la descripción escrita por la empresa. */
export type Attention = { jobId: string; reason: string };

/** Vehículos activos: en un trabajo en curso, con trabajo hoy (aún no en curso) y libres. */
export type FleetToday = { service: number; loading: number; available: number };

export type Dashboard = {
  stats: readonly Stat[];
  attention: Attention | null;
  jobs: readonly Job[];
  stages: readonly Stage[];
  activity: readonly ActivityItem[];
  fleet: FleetToday;
};
