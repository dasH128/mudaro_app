import { z } from "zod";

import { LOCALES } from "@/app/i18n/config";
import { parseDecimal } from "@/features/fleet/domain/new-vehicle";
import { EXTRA_NAME_MAX, EXTRA_PRICE_CENTS_MAX, PRICE_MODES, type CompanyExtra } from "../../domain/types";

// RF-07: alta y edición de un servicio extra de la empresa. Errores en código: el formulario los traduce.

export type ExtraField = "name" | "catalogExtraId" | "priceMode" | "price";
export type ExtraErrorCode = "nameRequired" | "tooLong" | "nameTaken" | "priceRequired" | "priceInvalid" | "invalid" | "failed";
export type ExtraFieldErrors = Partial<Record<ExtraField | "form", ExtraErrorCode>>;

export type ExtraFormState = { status: "idle" } | { status: "error"; fieldErrors: ExtraFieldErrors } | { status: "saved"; id: string };

const schema = z.object({
  lang: z.enum(LOCALES),
  /** Vacío = servicio nuevo. */
  id: z.union([z.literal(""), z.uuid()]),
  /** Vacío = servicio propio, sin tipo del catálogo. */
  catalogExtraId: z.union([z.literal(""), z.uuid("invalid")]),
  name: z.string().trim().min(1, "nameRequired").max(EXTRA_NAME_MAX, "tooLong"),
  priceMode: z.enum(PRICE_MODES, "invalid"),
  price: z
    .string()
    .trim()
    .min(1, "priceRequired")
    .transform((text) => parseDecimal(text))
    .refine((value) => !Number.isNaN(value) && value >= 0 && value * 100 <= EXTRA_PRICE_CENTS_MAX, "priceInvalid")
    .transform((value) => Math.round(value * 100)),
  active: z.enum(["true", "false"], "invalid").transform((value) => value === "true"),
});

export type ParsedExtra = { lang: (typeof LOCALES)[number]; id: string | null; extra: Omit<CompanyExtra, "id"> };

export function readExtraValues(formData: FormData): Record<string, unknown> {
  const field = (name: string) => {
    const raw = formData.get(name);
    return typeof raw === "string" ? raw : "";
  };
  return Object.fromEntries(["lang", "id", "catalogExtraId", "name", "priceMode", "price", "active"].map((name) => [name, field(name)]));
}

export function parseExtra(input: Record<string, unknown>): { ok: true; data: ParsedExtra } | { ok: false; fieldErrors: ExtraFieldErrors } {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors: ExtraFieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (field === "name" || field === "catalogExtraId" || field === "priceMode" || field === "price") {
        fieldErrors[field] ??= issue.message as ExtraErrorCode;
      } else fieldErrors.form ??= "invalid";
    }
    return { ok: false, fieldErrors };
  }
  const { lang, id, catalogExtraId, name, priceMode, price, active } = result.data;
  return {
    ok: true,
    data: {
      lang,
      id: id === "" ? null : id,
      extra: { catalogExtraId: catalogExtraId === "" ? null : catalogExtraId, name, priceMode, priceCents: price, active },
    },
  };
}
