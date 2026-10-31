import type { Vehicle } from "../domain/types";

// Almacén en memoria de los vehículos creados: se pierde al reiniciar el servidor.
// TODO(supabase): sustituir por la tabla de vehículos (RLS por company_id, RNF-01).
// Va en `globalThis` para que la acción y la página compartan el mismo almacén en desarrollo.

type StoreState = { vehicles: Vehicle[]; sequence: number };

const holder = globalThis as typeof globalThis & { __mudaroVehicles?: StoreState };

function state(): StoreState {
  return (holder.__mudaroVehicles ??= { vehicles: [], sequence: 0 });
}

/** Siguiente identificador libre. */
export function nextVehicleId(): string {
  const store = state();
  store.sequence += 1;
  return `vn${store.sequence}`;
}

export function saveVehicle(vehicle: Vehicle): void {
  state().vehicles.push(vehicle);
}

/** Vehículos creados en esta sesión, en el orden en que se añadieron. */
export function listCreatedVehicles(): Vehicle[] {
  return [...state().vehicles];
}
