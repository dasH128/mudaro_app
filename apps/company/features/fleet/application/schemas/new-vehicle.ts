import { z } from "zod";

import { LOCALES } from "@/app/i18n/config";
import { LIMITS, VEHICLE_TYPES, parseDecimal, type NewVehicle, type VehicleType } from "../../domain/new-vehicle";
import { normalizePlate } from "../../domain/plate";

// RF-05: alta de un vehículo con lo esencial (tipo, matrícula, capacidad y coste por km).
// Los mensajes de error son códigos: el formulario los traduce con el diccionario del idioma de la URL.

export type FieldName = "type" | "plate" | "name" | "capacity" | "maxLoad" | "cost" | "active";

export type ErrorCode =
  | "plateRequired"
  | "plateInvalid"
  | "plateTaken"
  | "tooLong"
  | "capacityRequired"
  | "capacityInvalid"
  | "maxLoadInvalid"
  | "costRequired"
  | "costInvalid"
  | "invalid";

/** Lo que el formulario envía, tal cual lo escribió la persona. */
export type FormValues = {
  type: VehicleType;
  plate: string;
  name: string;
  capacity: string;
  maxLoad: string;
  cost: string;
  /** "true" o "false": el interruptor de disponibilidad. */
  active: "true" | "false";
};

export type FieldErrors = Partial<Record<FieldName, ErrorCode>>;

export type FormState = { status: "idle" } | { status: "error"; fieldErrors: FieldErrors };

const schema = z.object({
  lang: z.enum(LOCALES),
  type: z.enum(VEHICLE_TYPES, "invalid"),
  plate: z
    .string()
    .trim()
    .min(1, "plateRequired")
    .refine((value) => normalizePlate(value) !== null, "plateInvalid")
    .transform((value) => normalizePlate(value) ?? value),
  name: z.string().trim().max(LIMITS.nameMax, "tooLong"),
  capacity: z
    .string()
    .trim()
    .min(1, "capacityRequired")
    .transform(parseDecimal)
    .refine((value) => value > 0 && value <= LIMITS.capacityM3Max, "capacityInvalid"),
  maxLoad: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : parseDecimal(value)))
    .refine((value) => value === null || (Number.isInteger(value) && value > 0 && value <= LIMITS.maxLoadKgMax), "maxLoadInvalid"),
  cost: z
    .string()
    .trim()
    .min(1, "costRequired")
    .transform(parseDecimal)
    .refine((value) => value > 0 && value * 100 <= LIMITS.costPerKmCentsMax, "costInvalid")
    .transform((value) => Math.round(value * 100)),
  active: z.enum(["true", "false"], "invalid").transform((value) => value === "true"),
});

/** "add" vuelve a la frota; "another" deja el formulario en blanco para el siguiente. */
export type Intent = "add" | "another";

export type ParsedVehicle = { lang: (typeof LOCALES)[number]; vehicle: NewVehicle; intent: Intent };

/** Lee el FormData tal cual llega. */
export function readValues(formData: FormData): Record<string, unknown> {
  const field = (name: string) => {
    const raw = formData.get(name);
    return typeof raw === "string" ? raw : "";
  };
  return {
    lang: field("lang"),
    type: field("type"),
    plate: field("plate"),
    name: field("name"),
    capacity: field("capacity"),
    maxLoad: field("maxLoad"),
    cost: field("cost"),
    active: field("active"),
  };
}

export const readIntent = (formData: FormData): Intent => (formData.get("intent") === "another" ? "another" : "add");

/** Valida y convierte a `NewVehicle`. Si algo falla, devuelve el primer código de cada campo. */
export function parseNewVehicle(
  input: Record<string, unknown>,
  intent: Intent,
): { ok: true; data: ParsedVehicle } | { ok: false; fieldErrors: FieldErrors } {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && field !== "lang") fieldErrors[field as FieldName] ??= issue.message as ErrorCode;
    }
    return { ok: false, fieldErrors };
  }

  const { lang, type, plate, name, capacity, maxLoad, cost, active } = result.data;
  return {
    ok: true,
    data: {
      lang,
      intent,
      vehicle: {
        type,
        plate,
        name: name === "" ? null : name,
        capacityM3: capacity,
        maxLoadKg: maxLoad,
        costPerKmCents: cost,
        active,
      },
    },
  };
}
