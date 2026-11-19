// Editor de orçamento (RF-35 a RF-42). TypeScript puro: sin React, Next ni Supabase.
// El cálculo lo hace @mudaro/quotes; aquí viven el estado del borrador y cómo se pasa del cálculo a las líneas.

import type { CalcBaseLine, CalcInput, CalcResult } from "@mudaro/quotes";

import type { CompanyExtra, PriceMode, QuotePresentation } from "@/features/pricing/domain/types";

export type EditorLineKind = "base" | "extra" | "manual";

/** Una línea del borrador, tal cual se edita. Importes en céntimos. */
export type EditorLine = {
  /** Clave estable en pantalla (no es el id de la base de datos). */
  key: string;
  kind: EditorLineKind;
  /** Línea base que salió del cálculo. Al cambiar operários, horas o km, su cantidad se recalcula. */
  code: CalcBaseLine["code"] | null;
  companyExtraId: string | null;
  description: string;
  quantity: number;
  unit: string | null;
  unitPriceCents: number;
  /** Solo los extras pueden ser opcionales (decisión 1 del paso 5). */
  optional: boolean;
  /** La empresa cambió el precio o la cantidad a mano (RF-37): un recálculo ya no la toca. */
  edited: boolean;
};

/** Lo que el editor guarda en el borrador. */
export type EditorDraft = {
  pricingMode: QuotePresentation;
  /** Km escritos por la empresa, de la base a la base (P2). `null` = aún sin escribir. */
  km: number | null;
  /** Valores a mano (RF-37). `null` = usar lo sugerido. */
  operators: number | null;
  hours: number | null;
  /** Último día de validez, aaaa-mm-dd. */
  validUntil: string;
  conditions: string;
  lines: readonly EditorLine[];
};

/** Textos de las líneas base: los pone la interfaz en el idioma de la empresa. */
export type BaseLineLabels = Record<CalcBaseLine["code"], string>;

/** Cantidad sugerida de un servicio extra según cómo se cobra. */
export function extraQuantity(mode: PriceMode, calc: Pick<CalcResult, "adjustedVolumeM3" | "totalHours">): number {
  switch (mode) {
    case "hour":
      return Math.max(calc.totalHours, 1);
    case "m3":
    case "m3_month":
      return Math.max(Math.round(calc.adjustedVolumeM3 * 10) / 10, 1);
    case "fixed":
    case "unit":
      return 1;
  }
}

/** Unidad que se muestra en la línea de un extra. */
export function extraUnit(mode: PriceMode): string | null {
  switch (mode) {
    case "hour":
      return "h";
    case "m3":
      return "m³";
    case "m3_month":
      return "m³/mês";
    case "unit":
      return "un";
    case "fixed":
      return null;
  }
}

let keySeed = 0;
export const newLineKey = () => `line-${Date.now().toString(36)}-${(keySeed++).toString(36)}`;

export function baseLineOf(line: CalcBaseLine, labels: BaseLineLabels): EditorLine {
  return {
    key: `base-${line.code}`,
    kind: "base",
    code: line.code,
    companyExtraId: null,
    description: labels[line.code],
    quantity: line.quantity,
    unit: line.unit,
    unitPriceCents: line.unitPriceCents,
    optional: false,
    edited: false,
  };
}

export function extraLineOf(extra: CompanyExtra, calc: Pick<CalcResult, "adjustedVolumeM3" | "totalHours">, optional: boolean): EditorLine {
  return {
    key: newLineKey(),
    kind: "extra",
    code: null,
    companyExtraId: extra.id,
    description: extra.name,
    quantity: extraQuantity(extra.priceMode, calc),
    unit: extraUnit(extra.priceMode),
    unitPriceCents: extra.priceCents,
    optional,
    edited: false,
  };
}

/**
 * Líneas de un orçamento nuevo: las base del cálculo y, como incluidos, los servicios activos de la empresa cuyo tipo
 * marcó el cliente en el inventario (RF-24, B5). La empresa puede pasarlos a opcionales o quitarlos.
 */
export function initialLines(
  calc: CalcResult,
  labels: BaseLineLabels,
  extras: readonly CompanyExtra[],
  markedTypeIds: readonly string[],
): EditorLine[] {
  const suggested = extras.filter((extra) => extra.active && extra.catalogExtraId && markedTypeIds.includes(extra.catalogExtraId));
  return [...calc.lines.map((line) => baseLineOf(line, labels)), ...suggested.map((extra) => extraLineOf(extra, calc, false))];
}

/**
 * Tras cambiar operários, horas o km: las líneas base sin tocar a mano se rehacen con el cálculo nuevo; las que la
 * empresa editó se conservan. La línea de ajuste al mínimo aparece o desaparece según el cálculo.
 */
export function refreshBaseLines(lines: readonly EditorLine[], calc: CalcResult, labels: BaseLineLabels): EditorLine[] {
  const fresh = calc.lines.map((line) => baseLineOf(line, labels));
  const kept = lines.filter((line) => line.kind === "base" && line.edited);
  const keptCodes = new Set(kept.map((line) => line.code));
  const base = [...kept, ...fresh.filter((line) => !keptCodes.has(line.code))];
  const order: CalcBaseLine["code"][] = ["labour", "transport", "floor-surcharge", "parking-surcharge", "minimum"];
  base.sort((a, b) => order.indexOf(a.code ?? "minimum") - order.indexOf(b.code ?? "minimum"));
  return [...base, ...lines.filter((line) => line.kind !== "base")];
}

export const lineTotalCents = (line: Pick<EditorLine, "quantity" | "unitPriceCents">) => Math.round(line.quantity * line.unitPriceCents);

/** Entrada del cálculo para un borrador: los km del borrador sobre los datos del pedido. */
export function calcInputOf(base: Omit<CalcInput, "km">, draft: Pick<EditorDraft, "km">): CalcInput {
  return { ...base, km: draft.km };
}

/** Errores al guardar o enviar. Códigos: la interfaz los traduce. */
export const QUOTE_ERRORS = [
  "invalid",
  "noInventory",
  "shipmentClosed",
  "inventoryChanged",
  "empty",
  "invalidValidity",
  "notAllowed",
  "failed",
] as const;
export type QuoteError = (typeof QUOTE_ERRORS)[number];

export type QuoteSaveResult = { ok: true; quoteId: string } | { ok: false; error: QuoteError };
