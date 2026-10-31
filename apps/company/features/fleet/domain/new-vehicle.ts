import type { VehicleKind } from "./types";

// Alta de un vehículo (P7-2). Lógica pura, sin React ni Next.

export const VEHICLE_TYPES = ["small-van", "van", "medium-truck", "large-truck", "other"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

/** Valores habituales de cada tipo. Son una sugerencia: la persona los confirma o los cambia. */
export type VehiclePreset = { capacityM3: number; maxLoadKg: number; costPerKmCents: number };

const PRESETS: Record<Exclude<VehicleType, "other">, VehiclePreset> = {
  "small-van": { capacityM3: 8, maxLoadKg: 900, costPerKmCents: 20 },
  van: { capacityM3: 12, maxLoadKg: 1200, costPerKmCents: 25 },
  "medium-truck": { capacityM3: 20, maxLoadKg: 3500, costPerKmCents: 38 },
  "large-truck": { capacityM3: 25, maxLoadKg: 6000, costPerKmCents: 45 },
};

/** `null` en "Outro": la persona rellena todos los valores. */
export function presetOf(type: VehicleType): VehiclePreset | null {
  return type === "other" ? null : PRESETS[type];
}

/** Los camiones llevan icono de camión; el resto, de furgón. */
export function kindOf(type: VehicleType): VehicleKind {
  return type === "medium-truck" || type === "large-truck" ? "truck" : "van";
}

export const isVehicleType = (value: string): value is VehicleType => VEHICLE_TYPES.some((t) => t === value);

/** Límites razonables para cazar errores de tecleo (provisionales). */
export const LIMITS = {
  nameMax: 60,
  capacityM3Max: 200,
  maxLoadKgMax: 40_000,
  costPerKmCentsMax: 2_000,
} as const;

/** Lo que se necesita para dar de alta un vehículo, ya validado y convertido. */
export type NewVehicle = {
  type: VehicleType;
  /** Normalizada: AA-00-AA. */
  plate: string;
  /** Nombre corto; `null` si no se indicó. */
  name: string | null;
  capacityM3: number;
  maxLoadKg: number | null;
  costPerKmCents: number;
  active: boolean;
};

/** "1 200" → 1200, "0,25" → 0.25. `NaN` si no es un número. */
export function parseDecimal(text: string): number {
  const clean = text.replace(/[\s\u00A0]/g, "").replace(",", ".");
  return /^\d+(\.\d+)?$/.test(clean) ? Number(clean) : Number.NaN;
}

/** Lo que el formulario necesita saber de la frota actual: matrículas, nombres y capacidad disponible. */
export type FleetSnapshot = {
  vehicles: { name: string; plate: string; kind: VehicleKind }[];
  /** Suma de la capacidad de los vehículos activos, en m³. */
  activeCapacityM3: number;
};
