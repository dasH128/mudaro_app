"use server";

import { revalidatePath } from "next/cache";

import { ROUTES, localePath } from "@/app/lib/routes";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { setVehicleActive, updateVehicleData } from "../../infrastructure/fleet.repo";
import {
  parseVehicleActive,
  parseVehicleData,
  type VehicleActiveState,
  type VehicleDataState,
} from "../schemas/vehicle-data";

// RF-05: editar, desactivar y reactivar un vehículo desde su panel. Cada acción comprueba sesión y rol en servidor
// (solo administradores, RNF-03); las funciones de la base de datos lo vuelven a comprobar.

/** Guarda tipo, capacidad, carga y coste. El panel la llama al salir de cada campo. */
export async function updateVehicleDataAction(_previous: VehicleDataState, formData: FormData): Promise<VehicleDataState> {
  await requireCompanySession(formData.get("lang"));
  const parsed = parseVehicleData(formData);
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.fieldErrors, formError: parsed.formError };

  const saved = await updateVehicleData(parsed.vehicleId, parsed.data);
  if (!saved.ok) return { status: "error", fieldErrors: {}, formError: saved.error };

  revalidatePath(localePath(parsed.lang, ROUTES.fleet.list));
  return { status: "saved", at: Date.now() };
}

/** Activa o desactiva el vehículo. Desactivar exige motivo (taller u otro). */
export async function setVehicleActiveAction(_previous: VehicleActiveState, formData: FormData): Promise<VehicleActiveState> {
  await requireCompanySession(formData.get("lang"));
  const parsed = parseVehicleActive(formData);
  if (!parsed.ok) return { status: "error", formError: "failed" };

  const saved = await setVehicleActive(parsed.vehicleId, parsed.active, parsed.reason);
  if (!saved.ok) return { status: "error", formError: saved.error };

  revalidatePath(localePath(parsed.lang, ROUTES.fleet.list));
  return { status: "idle" };
}
