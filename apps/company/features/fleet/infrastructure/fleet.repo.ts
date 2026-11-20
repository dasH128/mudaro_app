import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

import { isVehicleType, kindOf, type NewVehicle, type VehicleType } from "../domain/new-vehicle";
import {
  INACTIVE_REASONS,
  type FleetOverview,
  type InactiveReason,
  type Vehicle,
  type VehicleChange,
  type VehicleData,
  type VehicleEvent,
} from "../domain/types";

// Única puerta de entrada a los datos de la frota: las páginas importan de aquí.
// RLS por company_id (RNF-01); el coste por km vive en vehicle_costs, que solo lee el administrador (RNF-03).

type Options = {
  /** Solo el administrador ve el coste por km (RNF-03). Con `false` ni se consulta. */
  includeCost: boolean;
};

type CreateInput = NewVehicle;

export type CreateVehicleResult = { ok: true; vehicleId: string } | { ok: false; error: "plateTaken" };

// Un solo literal: el cliente de Supabase deduce el tipo de las filas del texto del select.
const VEHICLE_COLUMNS = "id, type, plate, name, capacity_m3, max_load_kg, active, inactive_reason, inactive_since, inactive_user:company_users!vehicles_inactive_by_fkey(name)";

/** aaaa-mm-dd de Lisboa a partir de un instante. */
function lisbonDay(instant: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon" }).format(new Date(instant));
}

type AuditData = {
  by?: string;
  withoutCost?: boolean;
  from?: unknown;
  to?: unknown;
  fromKg?: number | null;
  toKg?: number | null;
  fromCents?: number | null;
  toCents?: number | null;
  reason?: unknown;
};

const asNumber = (value: unknown): number | null => (value === null || value === undefined || value === "" ? null : Number(value));

/** Convierte un evento de audit_log en un cambio del histórico. Sin permiso de coste, sus cambios no salen (RNF-03). */
function changeOf(action: string, data: AuditData, includeCost: boolean): VehicleChange | null {
  switch (action) {
    case "vehicle_created":
      return { kind: "added", withoutCost: data.withoutCost === true };
    case "vehicle_type_changed":
      return isVehicleType(String(data.from)) && isVehicleType(String(data.to))
        ? { kind: "type-changed", from: data.from as VehicleType, to: data.to as VehicleType }
        : null;
    case "vehicle_capacity_changed":
      return { kind: "capacity-changed", fromM3: asNumber(data.from) ?? 0, toM3: asNumber(data.to) ?? 0 };
    case "vehicle_max_load_changed":
      return { kind: "max-load-changed", fromKg: asNumber(data.fromKg), toKg: asNumber(data.toKg) };
    case "vehicle_cost_changed":
      return includeCost ? { kind: "cost-changed", fromCents: asNumber(data.fromCents), toCents: asNumber(data.toCents) ?? 0 } : null;
    case "vehicle_deactivated":
      return INACTIVE_REASONS.some((r) => r === data.reason) ? { kind: "deactivated", reason: data.reason as InactiveReason } : null;
    case "vehicle_reactivated":
      return { kind: "reactivated" };
    default:
      return null;
  }
}

/** Vehículos de la empresa de la sesión y los indicadores del mes. */
export async function getFleetOverview({ includeCost }: Options): Promise<FleetOverview> {
  const supabase = await createSupabaseServerClient();

  const [vehiclesResult, costsResult, auditResult] = await Promise.all([
    supabase.from("vehicles").select(VEHICLE_COLUMNS).order("created_at", { ascending: true }),
    // Con includeCost a false la consulta ni se hace: el importe no sale de esta capa.
    includeCost ? supabase.from("vehicle_costs").select("vehicle_id, cost_per_km_cents") : Promise.resolve(null),
    supabase
      .from("audit_log")
      .select("id, entity_id, action, occurred_at, data")
      .eq("entity", "vehicle")
      .order("occurred_at", { ascending: false }),
  ]);

  if (vehiclesResult.error) throw new Error(`fleet: no se pudieron leer los vehículos (${vehiclesResult.error.code})`);

  const costs = new Map((costsResult?.data ?? []).map((row) => [row.vehicle_id, row.cost_per_km_cents]));

  // Histórico por vehículo, del más reciente al más antiguo. Las acciones que no conoce este módulo se ignoran.
  const history = new Map<string, VehicleEvent[]>();
  for (const row of auditResult.data ?? []) {
    const change = changeOf(row.action, (row.data ?? {}) as AuditData, includeCost);
    if (!change) continue;
    const event = { ...change, id: String(row.id), at: lisbonDay(row.occurred_at), by: (row.data as AuditData | null)?.by ?? "" } as VehicleEvent;
    history.set(row.entity_id, [...(history.get(row.entity_id) ?? []), event]);
  }

  const vehicles: Vehicle[] = vehiclesResult.data.map((row) => {
    const cost = costs.get(row.id) ?? null;
    return {
      id: row.id,
      name: row.name ?? row.plate,
      type: row.type,
      kind: kindOf(row.type),
      plate: row.plate,
      capacityM3: Number(row.capacity_m3),
      maxLoadKg: row.max_load_kg,
      costPerKmCents: cost,
      // Sin permiso de coste no se sabe si falta: solo el administrador entra en el panel.
      costMissing: includeCost && cost === null,
      active: row.active,
      inactive:
        !row.active && row.inactive_reason && row.inactive_since
          ? { reason: row.inactive_reason, since: row.inactive_since, by: row.inactive_user?.name ?? "" }
          : undefined,
      // TODO(agenda): estado en directo, trabajos, uso y presupuestos dependen de los pasos 5 y 6 del modelo.
      live: { kind: "free" },
      lastUseOn: null,
      jobs: [],
      weekHours: [0, 0, 0, 0, 0, 0, 0],
      quotes30d: { total: 0, accepted: 0 },
      usage: { jobs: 0, km: 0, hours: 0 },
      history: history.get(row.id) ?? [],
    };
  });

  // TODO(presupuestos): sin presupuestos todavía no hay viajes extra que contar.
  return { vehicles, metrics: { extraTripQuotes: 0 } };
}

/** Da de alta un vehículo con la función `create_vehicle` (valida sesión y rol en la base de datos). */
export async function createVehicle(input: CreateInput): Promise<CreateVehicleResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_vehicle", {
    p_type: input.type,
    p_plate: input.plate,
    p_name: input.name ?? "",
    p_capacity_m3: input.capacityM3,
    // La carga máxima es opcional y la función acepta null, pero el generador de tipos marca todos los argumentos como no nulos.
    p_max_load_kg: input.maxLoadKg as number,
    p_cost_per_km_cents: input.costPerKmCents,
    p_active: input.active,
  });

  // 23505: unique_violation de (company_id, plate)
  if (error?.code === "23505") return { ok: false, error: "plateTaken" };
  if (error || !data) throw new Error(`fleet: no se pudo crear el vehículo (${error?.code ?? "sin id"})`);
  return { ok: true, vehicleId: data };
}

export type EditVehicleResult = { ok: true } | { ok: false; error: "notFound" | "failed" };

/** Traduce el error de una función de edición: P0002 es un vehículo que no existe o es de otra empresa. */
function editResult(error: { code?: string } | null): EditVehicleResult {
  if (!error) return { ok: true };
  if (error.code === "P0002") return { ok: false, error: "notFound" };
  // 23514: un valor fuera de los límites de la tabla. zod ya los comprueba, así que llegar aquí es un fallo.
  console.error(`fleet: no se pudo editar el vehículo (${error.code ?? "sin código"})`);
  return { ok: false, error: "failed" };
}

/** Guarda tipo, capacidad, carga y coste con `update_vehicle_data` (valida sesión y rol en la base de datos). */
export async function updateVehicleData(vehicleId: string, data: VehicleData): Promise<EditVehicleResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_vehicle_data", {
    p_vehicle_id: vehicleId,
    p_type: data.type,
    p_capacity_m3: data.capacityM3,
    // La carga máxima es opcional y la función acepta null, pero el generador de tipos marca todos los argumentos como no nulos.
    p_max_load_kg: data.maxLoadKg as number,
    p_cost_per_km_cents: data.costPerKmCents,
  });
  return editResult(error);
}

/** Activa o desactiva el vehículo con `set_vehicle_active`. Desactivar exige motivo. */
export async function setVehicleActive(vehicleId: string, active: boolean, reason: InactiveReason | null): Promise<EditVehicleResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_vehicle_active", {
    p_vehicle_id: vehicleId,
    p_active: active,
    // Al activar no hay motivo; el generador de tipos marca el argumento como no nulo.
    p_reason: reason as InactiveReason,
  });
  return editResult(error);
}
