import "server-only";

import type { FleetOverview, Vehicle } from "../domain/types";
import { MOCK_METRICS, mockVehicles } from "./mock-data";

// Única puerta de entrada a los datos de la frota: las páginas importan de aquí.
// TODO(supabase): sustituir los datos de ejemplo por consultas (RLS por company_id, RNF-01), conservando la firma.

type Options = {
  /** Día de hoy en Lisboa (aaaa-mm-dd): las fechas de ejemplo se calculan desde él. */
  today: string;
  /** Solo el administrador ve el coste por km (RNF-03). Con `false` el importe ni sale de esta capa. */
  includeCost: boolean;
};

/** Vehículos de la empresa de la sesión y los indicadores del mes. */
export async function getFleetOverview({ today, includeCost }: Options): Promise<FleetOverview> {
  const hideCost = (vehicle: Vehicle): Vehicle => ({
    ...vehicle,
    costPerKmCents: null,
    history: vehicle.history.filter((event) => event.kind !== "cost-changed"),
  });
  const vehicles = mockVehicles(today);

  return { vehicles: includeCost ? vehicles : vehicles.map(hideCost), metrics: MOCK_METRICS };
}
