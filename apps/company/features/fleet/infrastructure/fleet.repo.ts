import "server-only";

import { compactPlate } from "../domain/plate";
import { kindOf, type NewVehicle } from "../domain/new-vehicle";
import type { FleetOverview, Vehicle } from "../domain/types";
import { MOCK_METRICS, mockVehicles } from "./mock-data";
import { listCreatedVehicles, nextVehicleId, saveVehicle } from "./store";

// Única puerta de entrada a los datos de la frota: las páginas importan de aquí.
// TODO(supabase): sustituir los datos de ejemplo por consultas (RLS por company_id, RNF-01), conservando la firma.

type Options = {
  /** Día de hoy en Lisboa (aaaa-mm-dd): las fechas de ejemplo se calculan desde él. */
  today: string;
  /** Solo el administrador ve el coste por km (RNF-03). Con `false` el importe ni sale de esta capa. */
  includeCost: boolean;
  /** Provisional: simula una empresa sin vehículos para ver el estado vacío. Desaparece al usar Supabase. */
  empty?: boolean;
};

const allVehicles = (today: string): Vehicle[] => [...mockVehicles(today), ...listCreatedVehicles()];

/** Vehículos de la empresa de la sesión y los indicadores del mes. */
export async function getFleetOverview({ today, includeCost, empty = false }: Options): Promise<FleetOverview> {
  if (empty) return { vehicles: [], metrics: { extraTripProposals: 0 } };

  const hideCost = (vehicle: Vehicle): Vehicle => ({
    ...vehicle,
    costPerKmCents: null,
    history: vehicle.history.filter((event) => event.kind !== "cost-changed"),
  });
  const vehicles = allVehicles(today);

  return { vehicles: includeCost ? vehicles : vehicles.map(hideCost), metrics: MOCK_METRICS };
}

type CreateInput = NewVehicle & {
  /** Texto del tipo en el idioma de la interfaz ("Furgão"): el tipo es texto libre de la empresa. */
  typeLabel: string;
  /** Quién da el alta (de la sesión cuando exista). */
  by: string;
};

export type CreateVehicleResult = { ok: true; vehicle: Vehicle } | { ok: false; error: "plateTaken" };

/** Da de alta un vehículo. La matrícula es única en la frota. */
export async function createVehicle(input: CreateInput, { today }: { today: string }): Promise<CreateVehicleResult> {
  // TODO(supabase): la unicidad la garantiza un índice único (company_id, plate)
  const taken = allVehicles(today).some((v) => compactPlate(v.plate) === compactPlate(input.plate));
  if (taken) return { ok: false, error: "plateTaken" };

  const vehicle: Vehicle = {
    id: nextVehicleId(),
    name: input.name ?? input.plate,
    typeLabel: input.typeLabel,
    kind: kindOf(input.type),
    plate: input.plate,
    capacityM3: input.capacityM3,
    maxLoadKg: input.maxLoadKg,
    costPerKmCents: input.costPerKmCents,
    costMissing: false,
    active: input.active,
    inactive: input.active ? undefined : { reason: "other", since: today, by: input.by },
    live: { kind: "free" },
    lastUseOn: null,
    jobs: [],
    weekHours: [0, 0, 0, 0, 0, 0, 0],
    proposals30d: { total: 0, accepted: 0 },
    usage: { jobs: 0, km: 0, hours: 0 },
    history: [{ kind: "added", withoutCost: false, at: today, by: input.by }],
  };
  saveVehicle(vehicle);
  return { ok: true, vehicle };
}
