import { parseDatePt } from "@mudaro/validation";
import { z } from "zod";

import { LOCALES } from "@/app/i18n/config";
import { lisbonInstant } from "@/features/schedule/domain/lisbon-time";
import { HANDOVER_MOMENTS, INCIDENT_TYPES } from "../../domain/execution";

// Ejecución del trabajo desde el panel (paso 6.5). Los errores son códigos que traduce la ficha del trabajo.

export type ExecutionError =
  | "signerRequired"
  | "dateInvalid"
  | "timeInvalid"
  | "future"
  | "descriptionRequired"
  | "amountInvalid"
  | "noteRequired"
  | "fileRequired"
  | "fileType"
  | "fileTooBig"
  | "tooManyFiles"
  | "notFound"
  | "notOpen"
  | "wrongStatus"
  | "duplicate"
  | "upload"
  | "failed";

export type ExecutionState = { status: "idle" } | { status: "saved"; at: number } | { status: "error"; error: ExecutionError };

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 10;
const FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const text = (formData: FormData, name: string) => {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim() : "";
};

/** Campos comunes: idioma, trabajo (uuid) y pedido (MD-0836, para refrescar su ficha). */
export function parseBase(formData: FormData) {
  return z
    .object({ lang: z.enum(LOCALES), jobId: z.uuid(), orderId: z.string().regex(/^MD-\d{4,}$/) })
    .safeParse({ lang: text(formData, "lang"), jobId: text(formData, "jobId"), orderId: text(formData, "orderId") });
}

/** Día dd/mm/aaaa y hora hh:mm de Lisboa → instante. No se admite el futuro (con 5 minutos de margen). */
export function parseMoment(formData: FormData, now = Date.now()): { ok: true; at: string } | { ok: false; error: ExecutionError } {
  const date = parseDatePt(text(formData, "date"));
  if (!date) return { ok: false, error: "dateInvalid" };
  const at = lisbonInstant(date, text(formData, "time"));
  if (!at) return { ok: false, error: "timeInvalid" };
  if (Date.parse(at) > now + 5 * 60 * 1000) return { ok: false, error: "future" };
  return { ok: true, at };
}

/** Ficheros elegidos (los vacíos que manda un input sin selección se ignoran). */
export function parseFiles(formData: FormData, name: string, required: boolean): { ok: true; files: File[] } | { ok: false; error: ExecutionError } {
  const files = formData.getAll(name).filter((item): item is File => item instanceof File && item.size > 0);
  if (required && files.length === 0) return { ok: false, error: "fileRequired" };
  if (files.length > MAX_FILES) return { ok: false, error: "tooManyFiles" };
  if (files.some((file) => !FILE_TYPES.includes(file.type))) return { ok: false, error: "fileType" };
  if (files.some((file) => file.size > MAX_FILE_BYTES)) return { ok: false, error: "fileTooBig" };
  return { ok: true, files };
}

export const momentSchema = z.enum(HANDOVER_MOMENTS);
export const photoMomentSchema = z.enum([...HANDOVER_MOMENTS, "incident"]);
export const incidentTypeSchema = z.enum(INCIDENT_TYPES);

export const signerSchema = z.string().trim().min(1).max(120);
export const remarksSchema = z.string().trim().max(1000);
export const descriptionSchema = z.string().trim().min(1).max(1000);
export const noteSchema = z.string().trim().min(1).max(1000);

/** "12,50" → 1250 céntimos; vacío = 0. Hasta 100 000 €. */
export function parseAmount(value: string): number | null {
  if (value === "") return 0;
  const clean = value.replace(/[\s €]/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const cents = Math.round(Number(clean) * 100);
  return cents <= 10_000_000 ? cents : null;
}

export { text as readText };
