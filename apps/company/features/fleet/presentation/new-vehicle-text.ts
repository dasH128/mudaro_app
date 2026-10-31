import { interpolate } from "@/app/i18n/interpolate";
import { formatAmount, formatCompact, formatInteger } from "@/app/lib/format";
import { kindOf, presetOf, type FleetSnapshot, type VehicleType } from "../domain/new-vehicle";
import type { FormValues } from "../application/schemas/new-vehicle";
import type { FleetText } from "./fleet-text";

export type NewVehicleText = FleetText["new"];

/** "Furgão V-04" (siguiente número libre de furgones) o "Camião grande 2" (si ya hay uno con ese nombre). Vacío en "Outro". */
export function suggestedName(type: VehicleType, fleet: FleetSnapshot, t: NewVehicleText): string {
  if (type === "other") return "";
  if (kindOf(type) === "van") {
    const number = String(fleet.vehicles.filter((v) => v.kind === "van").length + 1).padStart(2, "0");
    return interpolate(t.vanName, { number });
  }
  const label = t.types[type].label;
  const same = fleet.vehicles.filter((v) => v.name.startsWith(label)).length;
  return same === 0 ? label : `${label} ${same + 1}`;
}

/** Valores que el formulario sugiere al elegir un tipo, ya formateados para el campo. */
export function suggestedValues(type: VehicleType, fleet: FleetSnapshot, t: NewVehicleText) {
  const preset = presetOf(type);
  return {
    name: suggestedName(type, fleet, t),
    capacity: preset ? formatCompact(preset.capacityM3) : "",
    maxLoad: preset ? formatInteger(preset.maxLoadKg) : "",
    cost: preset ? formatAmount(preset.costPerKmCents) : "",
  };
}

export const DEFAULT_TYPE: VehicleType = "van";

/** Valores con los que arranca el formulario: un furgón con sus valores habituales. */
export function defaultValues(fleet: FleetSnapshot, t: NewVehicleText): FormValues {
  return { type: DEFAULT_TYPE, plate: "", ...suggestedValues(DEFAULT_TYPE, fleet, t), active: "true" };
}
