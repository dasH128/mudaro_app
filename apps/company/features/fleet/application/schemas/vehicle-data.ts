import { z } from "zod";

import { LOCALES } from "@/app/i18n/config";
import { VEHICLE_TYPES } from "../../domain/new-vehicle";
import { INACTIVE_REASONS, type InactiveReason, type VehicleData } from "../../domain/types";
import { capacityField, costField, maxLoadField, type ErrorCode } from "./new-vehicle";

// RF-05: editar los datos de un vehículo y activarlo o desactivarlo desde su panel (P7).
// Los errores son códigos: el panel los traduce con el diccionario del idioma de la URL.

export type DataField = "type" | "capacity" | "maxLoad" | "cost";
export type DataFieldErrors = Partial<Record<DataField, ErrorCode>>;

/** Lo que el servidor puede contestar además de los errores de cada campo. */
export type FormError = "notFound" | "failed";

export type VehicleDataState =
  | { status: "idle" }
  | { status: "saved"; at: number }
  | { status: "error"; fieldErrors: DataFieldErrors; formError?: FormError };

export type VehicleActiveState = { status: "idle" } | { status: "error"; formError: FormError };

const dataSchema = z.object({
  lang: z.enum(LOCALES),
  vehicleId: z.uuid(),
  type: z.enum(VEHICLE_TYPES, "invalid"),
  capacity: capacityField,
  maxLoad: maxLoadField,
  cost: costField,
});

const field = (formData: FormData, name: string) => {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw : "";
};

export function parseVehicleData(
  formData: FormData,
):
  | { ok: true; lang: (typeof LOCALES)[number]; vehicleId: string; data: VehicleData }
  | { ok: false; fieldErrors: DataFieldErrors; formError?: FormError } {
  const result = dataSchema.safeParse({
    lang: field(formData, "lang"),
    vehicleId: field(formData, "vehicleId"),
    type: field(formData, "type"),
    capacity: field(formData, "capacity"),
    maxLoad: field(formData, "maxLoad"),
    cost: field(formData, "cost"),
  });
  if (!result.success) {
    const fieldErrors: DataFieldErrors = {};
    let formError: FormError | undefined;
    for (const issue of result.error.issues) {
      const name = issue.path[0];
      if (name === "lang" || name === "vehicleId") formError = "notFound";
      else if (typeof name === "string") fieldErrors[name as DataField] ??= issue.message as ErrorCode;
    }
    return { ok: false, fieldErrors, formError };
  }
  const { lang, vehicleId, type, capacity, maxLoad, cost } = result.data;
  return { ok: true, lang, vehicleId, data: { type, capacityM3: capacity, maxLoadKg: maxLoad, costPerKmCents: cost } };
}

const activeSchema = z.discriminatedUnion("active", [
  z.object({ lang: z.enum(LOCALES), vehicleId: z.uuid(), active: z.literal("true") }),
  z.object({ lang: z.enum(LOCALES), vehicleId: z.uuid(), active: z.literal("false"), reason: z.enum(INACTIVE_REASONS) }),
]);

export function parseVehicleActive(
  formData: FormData,
): { ok: true; lang: (typeof LOCALES)[number]; vehicleId: string; active: boolean; reason: InactiveReason | null } | { ok: false } {
  const result = activeSchema.safeParse({
    lang: field(formData, "lang"),
    vehicleId: field(formData, "vehicleId"),
    active: field(formData, "active"),
    reason: field(formData, "reason"),
  });
  if (!result.success) return { ok: false };
  const value = result.data;
  return value.active === "true"
    ? { ok: true, lang: value.lang, vehicleId: value.vehicleId, active: true, reason: null }
    : { ok: true, lang: value.lang, vehicleId: value.vehicleId, active: false, reason: value.reason };
}
