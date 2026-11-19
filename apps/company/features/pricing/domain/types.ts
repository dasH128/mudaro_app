// Tarifa y servicios extra de la empresa (RF-06, RF-07). TypeScript puro: sin React, Next ni Supabase.
// Importes en céntimos, porcentajes y factores como números. El formato lo pone la interfaz.

/** Cómo se presenta el precio al cliente (decisión 3 del paso 5): cerrado o por hora con estimación. */
export const QUOTE_PRESENTATIONS = ["fixed", "hourly"] as const;
export type QuotePresentation = (typeof QUOTE_PRESENTATIONS)[number];

/** Modo de precio de un servicio extra (RF-07). */
export const PRICE_MODES = ["fixed", "unit", "hour", "m3", "m3_month"] as const;
export type PriceMode = (typeof PRICE_MODES)[number];

/** Una versión de la tarifa. Guardar cambios crea la siguiente; la anterior no cambia (RF-06). */
export type Tariff = {
  version: number;
  /** Desde cuándo es la vigente (ISO). */
  validFrom: string;
  operatorHourPriceCents: number;
  operatorHourCostCents: number;
  kmPriceCents: number;
  noLiftFloorSurchargeCents: number;
  parkingSurchargeCents: number;
  minimumServiceCents: number;
  stowageFactor: number;
  averageSpeedKmh: number;
  vatPct: number;
  /** Horas de más por cada piso sin elevador, en % (factor de acceso, RF-33). */
  noLiftFloorExtraPct: number;
  /** Horas de más por cada 25 m de estacionamiento, en %. */
  parkingExtraPctPer25m: number;
  /** Operarios por tramos de volumen (RF-32). */
  crewSmall: number;
  crewSmallMaxM3: number;
  crewMedium: number;
  crewMediumMaxM3: number;
  crewLarge: number;
  quotePresentation: QuotePresentation;
  quoteValidityDays: number;
};

/** Lo que se guarda: la tarifa sin versión ni fecha (las pone la base de datos). */
export type TariffInput = Omit<Tariff, "version" | "validFrom">;

/** Mismos límites que los `check` de la tabla `tariffs`. */
export const TARIFF_LIMITS = {
  hourCentsMax: 100_000,
  kmCentsMax: 10_000,
  surchargeCentsMax: 100_000,
  minimumCentsMax: 10_000_000,
  stowageMin: 1,
  stowageMax: 3,
  speedMin: 5,
  speedMax: 130,
  vatMax: 30,
  pctMax: 100,
  crewMax: 20,
  validityMax: 90,
} as const;

/** Servicio extra de la empresa (`company_extras`). */
export type CompanyExtra = {
  id: string;
  /** Tipo del catálogo de Mudaro. `null` = servicio propio (no aparece en el inventario del cliente). */
  catalogExtraId: string | null;
  name: string;
  priceMode: PriceMode;
  priceCents: number;
  active: boolean;
};

/** Mismo límite que el `check` de `company_extras.name`. */
export const EXTRA_NAME_MAX = 120;
/** Precio máximo de un servicio, en céntimos (100 000 €). */
export const EXTRA_PRICE_CENTS_MAX = 10_000_000;

/** Operarios que propone la tarifa para un volumen (RF-32). Se puede cambiar a mano en cada orçamento. */
export function crewFor(tariff: Pick<Tariff, "crewSmall" | "crewSmallMaxM3" | "crewMedium" | "crewMediumMaxM3" | "crewLarge">, volumeM3: number): number {
  if (volumeM3 <= tariff.crewSmallMaxM3) return tariff.crewSmall;
  if (volumeM3 <= tariff.crewMediumMaxM3) return tariff.crewMedium;
  return tariff.crewLarge;
}

/** Margen sobre el precio de una hora de operario, de 0 a 1. `null` sin precio. */
export function hourMargin(tariff: Pick<Tariff, "operatorHourPriceCents" | "operatorHourCostCents">): number | null {
  if (tariff.operatorHourPriceCents <= 0) return null;
  return (tariff.operatorHourPriceCents - tariff.operatorHourCostCents) / tariff.operatorHourPriceCents;
}
