import { parseDatePt } from "@mudaro/validation";
import { z } from "zod";

import { LOCALES } from "@/app/i18n/config";
import { lisbonInstant } from "../../domain/lisbon-time";

// Agenda (paso 6.2): asignar vehículo y equipo, reprogramar y cancelar. Los errores son códigos que traduce el panel.

export type ScheduleError =
  | "overlapVehicle"
  | "overlapCrew"
  | "unavailableVehicle"
  | "unavailableCrew"
  | "leadNotInCrew"
  | "notFound"
  | "notOpen"
  | "dateInvalid"
  | "timeInvalid"
  | "endBeforeStart"
  | "reasonRequired"
  | "failed";

export type ScheduleActionState =
  | { status: "idle" }
  | { status: "saved"; at: number }
  /** `name` y `orderId` completan el aviso de un solape ("Rui já está no MD-0836"). */
  | { status: "error"; error: ScheduleError; name?: string; orderId?: string | null };

const uuid = z.uuid();
const optionalUuid = z.union([z.literal(""), z.uuid()]).transform((value) => (value === "" ? null : value));

const field = (formData: FormData, name: string) => {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw : "";
};

const base = (formData: FormData) =>
  z.object({ lang: z.enum(LOCALES), jobId: uuid }).safeParse({ lang: field(formData, "lang"), jobId: field(formData, "jobId") });

export type Lang = (typeof LOCALES)[number];

/** Vehículo (uno o ninguno), personas marcadas y jefe de equipo. */
export function parseAssignments(
  formData: FormData,
): { ok: true; lang: Lang; jobId: string; vehicleIds: string[]; crewIds: string[]; leadId: string | null } | { ok: false; error: ScheduleError } {
  const head = base(formData);
  const vehicle = optionalUuid.safeParse(field(formData, "vehicleId"));
  const crew = z.array(uuid).max(30).safeParse(formData.getAll("crewIds"));
  const lead = optionalUuid.safeParse(field(formData, "leadId"));
  if (!head.success || !vehicle.success || !crew.success || !lead.success) return { ok: false, error: "failed" };
  // Un jefe de equipo que ya no está marcado no cuenta
  const leadId = lead.data && crew.data.includes(lead.data) ? lead.data : null;
  return {
    ok: true,
    lang: head.data.lang,
    jobId: head.data.jobId,
    vehicleIds: vehicle.data ? [vehicle.data] : [],
    crewIds: crew.data,
    leadId,
  };
}

/** Día dd/mm/aaaa y horas hh:mm de Lisboa → instantes de inicio y fin. */
export function parseReschedule(
  formData: FormData,
): { ok: true; lang: Lang; jobId: string; start: string; end: string } | { ok: false; error: ScheduleError } {
  const head = base(formData);
  if (!head.success) return { ok: false, error: "failed" };
  const date = parseDatePt(field(formData, "date").trim());
  if (!date) return { ok: false, error: "dateInvalid" };
  const start = lisbonInstant(date, field(formData, "start"));
  const end = lisbonInstant(date, field(formData, "end"));
  if (!start || !end) return { ok: false, error: "timeInvalid" };
  if (end <= start) return { ok: false, error: "endBeforeStart" };
  return { ok: true, lang: head.data.lang, jobId: head.data.jobId, start, end };
}

/** Motivo obligatorio, como en la base (1 a 500 caracteres). */
export function parseCancel(formData: FormData): { ok: true; lang: Lang; jobId: string; reason: string } | { ok: false; error: ScheduleError } {
  const head = base(formData);
  if (!head.success) return { ok: false, error: "failed" };
  const reason = z.string().trim().min(1).max(500).safeParse(field(formData, "reason"));
  if (!reason.success) return { ok: false, error: "reasonRequired" };
  return { ok: true, lang: head.data.lang, jobId: head.data.jobId, reason: reason.data };
}
