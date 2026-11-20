import { normalizePtPhone } from "@mudaro/validation";
import { z } from "zod";

import { LOCALES } from "@/app/i18n/config";
import { INACTIVE_REASONS, POSITIONS, type CrewData, type InactiveReason } from "../../domain/types";

// Personas del equipo sin cuenta (paso 6.0b): alta, edición y activar o desactivar.
// Los errores son códigos: el formulario los traduce con el diccionario del idioma de la URL.

/** Máximo del nombre, igual que la restricción de `crew_members`. */
export const NAME_MAX = 80;

export type CrewField = "name" | "phone" | "position";
export type CrewErrorCode = "nameRequired" | "nameTooLong" | "phoneInvalid" | "invalid";
export type CrewFieldErrors = Partial<Record<CrewField, CrewErrorCode>>;
export type CrewFormError = "notFound" | "failed";

/** Lo que el formulario envía, tal cual lo escribió la persona. */
export type CrewFormValues = { name: string; phone: string; position: CrewData["position"] };

export type CrewFormState =
  | { status: "idle" }
  | { status: "saved"; at: number }
  | { status: "error"; fieldErrors: CrewFieldErrors; formError?: CrewFormError };

export type CrewActiveState = { status: "idle" } | { status: "error"; formError: CrewFormError };

const crewSchema = z.object({
  lang: z.enum(LOCALES),
  name: z.string().trim().min(1, "nameRequired").max(NAME_MAX, "nameTooLong"),
  // Opcional: vacío es "sin telemóvel" (el panel lo avisa). Si se escribe, tiene que ser portugués.
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || normalizePtPhone(value) !== null, "phoneInvalid")
    .transform((value) => (value === "" ? null : normalizePtPhone(value))),
  position: z.enum(POSITIONS, "invalid"),
});

const field = (formData: FormData, name: string) => {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw : "";
};

type Parsed = { ok: true; lang: (typeof LOCALES)[number]; data: CrewData } | { ok: false; fieldErrors: CrewFieldErrors };

export function parseCrew(formData: FormData): Parsed {
  const result = crewSchema.safeParse({
    lang: field(formData, "lang"),
    name: field(formData, "name"),
    phone: field(formData, "phone"),
    position: field(formData, "position"),
  });
  if (!result.success) {
    const fieldErrors: CrewFieldErrors = {};
    for (const issue of result.error.issues) {
      const name = issue.path[0];
      if (name === "name" || name === "phone" || name === "position") fieldErrors[name] ??= issue.message as CrewErrorCode;
    }
    return { ok: false, fieldErrors };
  }
  const { lang, name, phone, position } = result.data;
  return { ok: true, lang, data: { name, phone, position } };
}

/** El id de la persona que se edita. */
export const readCrewId = (formData: FormData): string | null => {
  const parsed = z.uuid().safeParse(field(formData, "crewId"));
  return parsed.success ? parsed.data : null;
};

const activeSchema = z.discriminatedUnion("active", [
  z.object({ lang: z.enum(LOCALES), crewId: z.uuid(), active: z.literal("true") }),
  z.object({ lang: z.enum(LOCALES), crewId: z.uuid(), active: z.literal("false"), reason: z.enum(INACTIVE_REASONS) }),
]);

export function parseCrewActive(
  formData: FormData,
): { ok: true; lang: (typeof LOCALES)[number]; crewId: string; active: boolean; reason: InactiveReason | null } | { ok: false } {
  const result = activeSchema.safeParse({
    lang: field(formData, "lang"),
    crewId: field(formData, "crewId"),
    active: field(formData, "active"),
    reason: field(formData, "reason"),
  });
  if (!result.success) return { ok: false };
  const value = result.data;
  return value.active === "true"
    ? { ok: true, lang: value.lang, crewId: value.crewId, active: true, reason: null }
    : { ok: true, lang: value.lang, crewId: value.crewId, active: false, reason: value.reason };
}
