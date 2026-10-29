import { z } from "zod";

import { isValidPtPhone, isValidTaxId, normalizePtPhone, parseDatePt } from "@mudaro/validation";

import { LOCALES } from "@/app/i18n/config";
import { todayLisbon } from "@/app/lib/format";
import {
  CLIENT_TYPES,
  FLEXIBILITIES,
  INVENTORY_MODES,
  LINK_VALIDITY_DAYS,
  MAX_STOPS,
  SOURCES,
  type ClientType,
  type Flexibility,
  type InventoryMode,
  type LinkValidityDays,
  type NewOrder,
  type Source,
} from "@/features/orders/domain/types";

// RF-13: nombre, teléfono, origen, destino y fecha aproximada.
// Los mensajes de error son códigos: el formulario los traduce con el diccionario del idioma de la URL.

export type FieldName =
  | "phone"
  | "name"
  | "clientType"
  | "email"
  | "taxId"
  | "origin"
  | "destination"
  | "stops"
  | "date"
  | "flexibility"
  | "source"
  | "inventoryMode"
  | "linkValidityDays";

export type ErrorCode =
  | "phoneRequired"
  | "phoneInvalid"
  | "nameRequired"
  | "emailInvalid"
  | "taxIdInvalid"
  | "originRequired"
  | "destinationRequired"
  | "dateRequired"
  | "dateInvalid"
  | "datePast"
  | "tooLong"
  | "invalid";

/** Lo que el formulario envía, tal cual lo escribió la persona. */
export type FormValues = {
  phone: string;
  name: string;
  clientType: ClientType;
  email: string;
  taxId: string;
  clientId: string;
  origin: string;
  destination: string;
  stops: string[];
  date: string;
  flexibility: Flexibility;
  source: Source | "";
  inventoryMode: InventoryMode;
  linkValidityDays: string;
};

export type FieldErrors = Partial<Record<FieldName, ErrorCode>>;

export type FormState = { status: "idle" } | { status: "error"; fieldErrors: FieldErrors };

const stripSpaces = (value: string) => value.replace(/\s+/g, "");
const text = (required: ErrorCode, max = 200) => z.string().trim().min(1, required).max(max, "tooLong");

const linkDays = z
  .string()
  .transform(Number)
  .pipe(z.number().refine((n): n is LinkValidityDays => (LINK_VALIDITY_DAYS as readonly number[]).includes(n), "invalid"));

const schema = z
  .object({
    lang: z.enum(LOCALES),
    phone: z
      .string()
      .trim()
      .min(1, "phoneRequired")
      .refine(isValidPtPhone, "phoneInvalid")
      .transform((value) => normalizePtPhone(value) ?? value),
    name: text("nameRequired"),
    clientType: z.enum(CLIENT_TYPES, "invalid"),
    email: z
      .string()
      .trim()
      .max(200, "tooLong")
      .refine((value) => value === "" || z.email().safeParse(value).success, "emailInvalid"),
    taxId: z
      .string()
      .transform(stripSpaces)
      .refine((value) => value === "" || isValidTaxId(value), "taxIdInvalid"),
    clientId: z.string().max(64, "invalid"),
    origin: text("originRequired"),
    destination: text("destinationRequired"),
    stops: z.array(z.string().trim().min(1, "invalid").max(200, "tooLong")).max(MAX_STOPS, "invalid"),
    date: z.string().trim().min(1, "dateRequired"),
    flexibility: z.enum(FLEXIBILITIES, "invalid"),
    source: z.union([z.enum(SOURCES, "invalid"), z.literal("")]),
    inventoryMode: z.enum(INVENTORY_MODES, "invalid"),
    linkValidityDays: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.date === "") return;
    const iso = parseDatePt(value.date);
    if (!iso) ctx.addIssue({ code: "custom", path: ["date"], message: "dateInvalid" });
    else if (iso < todayLisbon()) ctx.addIssue({ code: "custom", path: ["date"], message: "datePast" });

    if (value.inventoryMode === "link" && !linkDays.safeParse(value.linkValidityDays).success) {
      ctx.addIssue({ code: "custom", path: ["linkValidityDays"], message: "invalid" });
    }
  });

export type ParsedOrder = { lang: (typeof LOCALES)[number]; order: NewOrder };

/** Lee el FormData tal cual llega. Las paradas se repiten con el mismo nombre. */
export function readValues(formData: FormData): Record<string, unknown> {
  const field = (name: string) => {
    const raw = formData.get(name);
    return typeof raw === "string" ? raw : "";
  };
  return {
    lang: field("lang"),
    phone: field("phone"),
    name: field("name"),
    clientType: field("clientType"),
    email: field("email"),
    taxId: field("taxId"),
    clientId: field("clientId"),
    origin: field("origin"),
    destination: field("destination"),
    stops: formData
      .getAll("stops")
      .filter((stop): stop is string => typeof stop === "string")
      .filter((stop) => stop.trim() !== ""),
    date: field("date"),
    flexibility: field("flexibility"),
    source: field("source"),
    inventoryMode: field("inventoryMode"),
    linkValidityDays: field("linkValidityDays"),
  };
}

/** Valida y convierte a `NewOrder`. Si algo falla, devuelve el primer código de cada campo. */
export function parseNewOrder(input: Record<string, unknown>): { ok: true; data: ParsedOrder } | { ok: false; fieldErrors: FieldErrors } {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && field !== "lang") fieldErrors[field as FieldName] ??= issue.message as ErrorCode;
    }
    return { ok: false, fieldErrors };
  }

  const { lang, ...value } = result.data;
  const iso = parseDatePt(value.date) as string; // ya validada por el schema
  const isLink = value.inventoryMode === "link";

  return {
    ok: true,
    data: {
      lang,
      order: {
        phone: value.phone,
        name: value.name,
        clientType: value.clientType,
        email: value.email === "" ? null : value.email,
        taxId: value.taxId === "" ? null : value.taxId,
        clientId: value.clientId === "" ? null : value.clientId,
        origin: value.origin,
        destination: value.destination,
        stops: value.stops,
        date: iso,
        flexibility: value.flexibility,
        source: value.source === "" ? null : value.source,
        inventoryMode: value.inventoryMode,
        linkValidityDays: isLink ? linkDays.parse(value.linkValidityDays) : null,
      },
    },
  };
}
