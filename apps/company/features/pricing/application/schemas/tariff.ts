import { z } from "zod";

import { LOCALES } from "@/app/i18n/config";
import { parseDecimal } from "@/features/fleet/domain/new-vehicle";
import { QUOTE_PRESENTATIONS, TARIFF_LIMITS, type TariffInput } from "../../domain/types";

// RF-06: guardar la tarifa crea una versión nueva. Se valida en servidor aunque el navegador ya lo compruebe, y los
// `check` de la tabla lo vuelven a comprobar. Los errores son códigos: el formulario los traduce.

/** Cómo se escribe cada campo: euros (se guardan en céntimos), número con decimales, entero o porcentaje. */
type FieldKind = "euros" | "decimal" | "integer";

type FieldSpec = { key: keyof TariffInput; kind: FieldKind; min: number; max: number };

/** Campos numéricos del formulario, con el mismo nombre que en `TariffInput`. Los límites son los de la tabla. */
export const TARIFF_FIELDS = {
  operatorHourPriceCents: { key: "operatorHourPriceCents", kind: "euros", min: 0, max: TARIFF_LIMITS.hourCentsMax },
  operatorHourCostCents: { key: "operatorHourCostCents", kind: "euros", min: 0, max: TARIFF_LIMITS.hourCentsMax },
  kmPriceCents: { key: "kmPriceCents", kind: "euros", min: 0, max: TARIFF_LIMITS.kmCentsMax },
  minimumServiceCents: { key: "minimumServiceCents", kind: "euros", min: 0, max: TARIFF_LIMITS.minimumCentsMax },
  vatPct: { key: "vatPct", kind: "decimal", min: 0, max: TARIFF_LIMITS.vatMax },
  noLiftFloorSurchargeCents: { key: "noLiftFloorSurchargeCents", kind: "euros", min: 0, max: TARIFF_LIMITS.surchargeCentsMax },
  parkingSurchargeCents: { key: "parkingSurchargeCents", kind: "euros", min: 0, max: TARIFF_LIMITS.surchargeCentsMax },
  noLiftFloorExtraPct: { key: "noLiftFloorExtraPct", kind: "decimal", min: 0, max: TARIFF_LIMITS.pctMax },
  parkingExtraPctPer25m: { key: "parkingExtraPctPer25m", kind: "decimal", min: 0, max: TARIFF_LIMITS.pctMax },
  stowageFactor: { key: "stowageFactor", kind: "decimal", min: TARIFF_LIMITS.stowageMin, max: TARIFF_LIMITS.stowageMax },
  averageSpeedKmh: { key: "averageSpeedKmh", kind: "decimal", min: TARIFF_LIMITS.speedMin, max: TARIFF_LIMITS.speedMax },
  crewSmall: { key: "crewSmall", kind: "integer", min: 1, max: TARIFF_LIMITS.crewMax },
  crewSmallMaxM3: { key: "crewSmallMaxM3", kind: "decimal", min: 0.1, max: 9999 },
  crewMedium: { key: "crewMedium", kind: "integer", min: 1, max: TARIFF_LIMITS.crewMax },
  crewMediumMaxM3: { key: "crewMediumMaxM3", kind: "decimal", min: 0.1, max: 9999 },
  crewLarge: { key: "crewLarge", kind: "integer", min: 1, max: TARIFF_LIMITS.crewMax },
  quoteValidityDays: { key: "quoteValidityDays", kind: "integer", min: 1, max: TARIFF_LIMITS.validityMax },
} as const satisfies Record<string, FieldSpec>;

export type TariffNumberField = keyof typeof TARIFF_FIELDS;
export type TariffField = TariffNumberField | "quotePresentation";

export type TariffErrorCode = "required" | "invalid" | "outOfRange" | "crewOrder" | "notAllowed" | "failed";
export type TariffFieldErrors = Partial<Record<TariffField | "form", TariffErrorCode>>;

/** Lo que escribió la persona, tal cual (texto de cada campo). */
export type TariffValues = Record<TariffNumberField, string> & { quotePresentation: string };

export type TariffFormState =
  | { status: "idle" }
  | { status: "error"; fieldErrors: TariffFieldErrors }
  | { status: "saved"; version: number };

/** Valor del formulario → número de la tarifa. `NaN` si no es un número. */
function toNumber(text: string, kind: FieldKind): number {
  const value = parseDecimal(text.trim());
  if (Number.isNaN(value)) return Number.NaN;
  if (kind === "euros") return Math.round(value * 100);
  if (kind === "integer") return Number.isInteger(value) ? value : Number.NaN;
  return value;
}

const fieldSchema = (spec: FieldSpec) =>
  z
    .string()
    .trim()
    .min(1, "required")
    .transform((text) => toNumber(text, spec.kind))
    .refine((value) => !Number.isNaN(value), "invalid")
    .refine((value) => value >= spec.min && value <= spec.max, "outOfRange");

const schema = z
  .object({
    lang: z.enum(LOCALES),
    quotePresentation: z.enum(QUOTE_PRESENTATIONS, "invalid"),
    ...(Object.fromEntries(Object.entries(TARIFF_FIELDS).map(([name, spec]) => [name, fieldSchema(spec)])) as Record<
      TariffNumberField,
      ReturnType<typeof fieldSchema>
    >),
  })
  .refine((value) => value.crewSmallMaxM3 < value.crewMediumMaxM3, { message: "crewOrder", path: ["crewMediumMaxM3"] });

/** Lee el FormData tal cual llega. */
export function readTariffValues(formData: FormData): Record<string, unknown> {
  const field = (name: string) => {
    const raw = formData.get(name);
    return typeof raw === "string" ? raw : "";
  };
  return Object.fromEntries(["lang", "quotePresentation", ...Object.keys(TARIFF_FIELDS)].map((name) => [name, field(name)]));
}

/** Valida y convierte a `TariffInput`. Si algo falla, devuelve el primer código de cada campo. */
export function parseTariff(
  input: Record<string, unknown>,
): { ok: true; lang: (typeof LOCALES)[number]; tariff: TariffInput } | { ok: false; fieldErrors: TariffFieldErrors } {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors: TariffFieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && field !== "lang") fieldErrors[field as TariffField] ??= issue.message as TariffErrorCode;
    }
    return { ok: false, fieldErrors };
  }
  const { lang, ...tariff } = result.data;
  return { ok: true, lang, tariff };
}
