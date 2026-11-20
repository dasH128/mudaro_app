import { z } from "zod";

import { parseDatePt } from "@mudaro/validation";

import { LOCALES } from "@/app/i18n/config";
import { parseOrderNumber } from "@/features/orders/domain/order-number";
import { QUOTE_PRESENTATIONS } from "@/features/pricing/domain/types";

// Lo que envía el editor de orçamento (RF-35 a RF-42). Se valida aquí aunque el navegador ya lo compruebe, y la base
// lo vuelve a comprobar (save_quote_draft calcula el total de cada línea; send_quote, la validez y el inventario).

const MAX_LINES = 60;
const BASE_CODES = ["labour", "transport", "floor-surcharge", "parking-surcharge", "minimum"] as const;

const line = z
  .object({
    kind: z.enum(["base", "extra", "manual"]),
    code: z.enum(BASE_CODES).nullable(),
    companyExtraId: z.uuid().nullable(),
    description: z.string().trim().min(1).max(200),
    quantity: z.number().positive().max(100_000),
    unit: z.string().trim().max(20).nullable(),
    unitPriceCents: z.number().int().min(0).max(1_000_000_000),
    optional: z.boolean(),
    edited: z.boolean(),
  })
  .refine((value) => !value.optional || value.kind === "extra")
  .refine((value) => value.kind !== "extra" || value.companyExtraId !== null);

const nullableNumber = z.number().min(0).max(1_000_000).nullable();

const schema = z.object({
  lang: z.enum(LOCALES),
  orderId: z.string().refine((id) => parseOrderNumber(id) !== null),
  pricingMode: z.enum(QUOTE_PRESENTATIONS),
  km: z.number().min(0).max(10_000).nullable(),
  operators: z.number().int().min(1).max(50).nullable(),
  hours: z.number().positive().max(500).nullable(),
  /** dd/mm/aaaa (RNF-10). */
  validUntil: z.string().refine((value) => parseDatePt(value) !== null, "invalidValidity").transform((value) => parseDatePt(value) as string),
  conditions: z.string().max(5000),
  summary: z.object({
    volumeM3: nullableNumber,
    vehicleCount: z.number().int().min(0).max(50),
    operatorCount: z.number().int().min(0).max(50),
    estimatedHours: nullableNumber,
    hourlyRateCents: z.number().int().min(0).max(100_000_000),
    estimatedCostCents: z.number().int().min(0).max(1_000_000_000),
    suggestedPriceCents: z.number().int().min(0).max(1_000_000_000),
    suggested: z.object({ operators: z.number().int().min(0).max(50), hours: z.number().min(0).max(500) }),
    alerts: z.array(z.string().max(40)).max(20),
  }),
  lines: z.array(line).min(1).max(MAX_LINES),
});

export type QuotePayload = z.input<typeof schema>;
export type ParsedQuote = z.output<typeof schema>;

export function parseQuote(input: unknown): { ok: true; data: ParsedQuote } | { ok: false; error: "invalid" | "invalidValidity" } {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const validity = result.error.issues.some((issue) => issue.message === "invalidValidity");
  return { ok: false, error: validity ? "invalidValidity" : "invalid" };
}

/** Lo que guarda save_quote_draft: el orçamento (con lo sugerido y lo final, RF-37) y sus líneas. */
export function toDatabase(quote: ParsedQuote): { quote: Record<string, unknown>; lines: Record<string, unknown>[] } {
  return {
    quote: {
      pricingMode: quote.pricingMode,
      volumeM3: quote.summary.volumeM3,
      vehicleCount: quote.summary.vehicleCount,
      operatorCount: quote.summary.operatorCount,
      estimatedHours: quote.summary.estimatedHours,
      km: quote.km,
      hourlyRateCents: quote.summary.hourlyRateCents,
      estimatedCostCents: quote.summary.estimatedCostCents,
      suggestedPriceCents: quote.summary.suggestedPriceCents,
      calculation: {
        suggested: quote.summary.suggested,
        final: { operators: quote.operators, hours: quote.hours },
        alerts: quote.summary.alerts,
        // Qué línea base es cada una, por posición: las líneas de la base de datos no guardan el código
        codes: quote.lines.map((l) => l.code),
      },
      validUntil: quote.validUntil,
      conditions: quote.conditions,
    },
    lines: quote.lines.map((l) => ({
      kind: l.kind,
      companyExtraId: l.companyExtraId,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unitPriceCents: l.unitPriceCents,
      optional: l.optional,
      origin: l.kind === "base" && !l.edited ? "calculated" : "manual",
    })),
  };
}
