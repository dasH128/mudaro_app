// Entidades de la frota (RF-05). Importes en céntimos y fechas ISO (aaaa-mm-dd), nunca texto formateado.

export type VehicleKind = "truck" | "van";

/** Estado en directo de un vehículo activo. `until` y `returnedAt` son horas hh:mm de Lisboa. */
export type LiveStatus =
  | { kind: "busy"; until: string; orderId: string }
  | { kind: "free"; returnedAt?: string };

export const INACTIVE_REASONS = ["workshop", "other"] as const;
export type InactiveReason = (typeof INACTIVE_REASONS)[number];

export type VehicleJob = {
  orderId: string;
  client: string;
  /** Día del trabajo, aaaa-mm-dd. */
  date: string;
  /** Horas hh:mm. */
  start: string;
  end: string;
  from: string;
  to: string;
};

export type VehicleChange =
  | { kind: "added"; withoutCost: boolean }
  | { kind: "cost-changed"; fromCents: number; toCents: number }
  | { kind: "max-load-changed"; fromKg: number; toKg: number }
  | { kind: "deactivated"; reason: InactiveReason };

/** Una entrada del histórico: qué cambió, cuándo (aaaa-mm-dd) y quién. */
export type VehicleEvent = { at: string; by: string } & VehicleChange;

export type Vehicle = {
  id: string;
  name: string;
  /** Tipo libre que escribe la empresa ("Camião", "Furgão pequeno"): no se traduce. */
  typeLabel: string;
  kind: VehicleKind;
  plate: string;
  capacityM3: number;
  /** Opcional al dar de alta el vehículo. */
  maxLoadKg: number | null;
  /** Solo lo devuelve el repo con `includeCost` (RNF-03); si no, `null`. */
  costPerKmCents: number | null;
  /** Falta el coste por km. Se sabe aunque el importe esté oculto. */
  costMissing: boolean;
  active: boolean;
  /** Presente solo en vehículos inactivos. */
  inactive?: { reason: InactiveReason; since: string; by: string };
  live: LiveStatus;
  /** Último día en que salió, aaaa-mm-dd. `null` si todavía no ha salido (vehículo recién añadido). */
  lastUseOn: string | null;
  /** Trabajos marcados, por orden de fecha. */
  jobs: VehicleJob[];
  /** Horas ocupadas por día, empezando hoy (7 valores). */
  weekHours: number[];
  /** Propostas de los últimos 30 días en que el cálculo eligió el vehículo. */
  proposals30d: { total: number; accepted: number };
  /** Uso del mes en curso. */
  usage: { jobs: number; km: number; hours: number };
  /** Del más reciente al más antiguo. */
  history: VehicleEvent[];
};

export type FleetMetrics = {
  /** Propostas del mes que necesitaron viaje extra por falta de capacidad. */
  extraTripProposals: number;
};

export type FleetOverview = { vehicles: Vehicle[]; metrics: FleetMetrics };
