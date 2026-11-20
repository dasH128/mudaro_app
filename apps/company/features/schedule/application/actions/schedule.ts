"use server";

import { revalidatePath } from "next/cache";

import { ROUTES, localePath } from "@/app/lib/routes";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { cancelJob, rescheduleJob, setJobAssignments, type AssignResult } from "../../infrastructure/schedule.repo";
import { parseAssignments, parseCancel, parseReschedule, type Lang, type ScheduleActionState } from "../schemas/schedule";

// Agenda (paso 6.2, RF-47, RF-48, RF-50). Cada acción comprueba sesión y rol en servidor (solo administradores),
// valida con zod y llama al repo; las funciones de la base de datos vuelven a comprobar rol, estado y solapes.

/** Convierte el resultado del repo en el estado del formulario. Los nombres los pone el panel, que los conoce. */
function stateOf(result: AssignResult): ScheduleActionState {
  if (result.ok) return { status: "saved", at: Date.now() };
  switch (result.error) {
    case "overlap":
      return { status: "error", error: result.resource === "vehicle" ? "overlapVehicle" : "overlapCrew", name: result.resourceId, orderId: result.orderId };
    case "unavailable":
      return {
        status: "error",
        error: result.resource === "vehicle" ? "unavailableVehicle" : result.resource === "lead" ? "leadNotInCrew" : "unavailableCrew",
        name: result.resourceId,
      };
    case "invalid":
      return { status: "error", error: "timeInvalid" };
    default:
      return { status: "error", error: result.error };
  }
}

/** La agenda y el detalle del pedido muestran vehículo y equipo: se refrescan los dos. */
function refresh(lang: Lang) {
  revalidatePath(localePath(lang, ROUTES.schedule));
  revalidatePath(localePath(lang, ROUTES.orders.list), "layout");
}

/** "Guardar equipa": sustituye vehículo, personas y jefe de equipo del trabajo. */
export async function assignJobAction(_previous: ScheduleActionState, formData: FormData): Promise<ScheduleActionState> {
  await requireCompanySession(formData.get("lang"));
  const parsed = parseAssignments(formData);
  if (!parsed.ok) return { status: "error", error: parsed.error };
  const result = await setJobAssignments(parsed);
  if (result.ok) refresh(parsed.lang);
  return stateOf(result);
}

/** "Reprogramar": nuevo día y horas; las asignaciones se mueven con el trabajo. */
export async function rescheduleJobAction(_previous: ScheduleActionState, formData: FormData): Promise<ScheduleActionState> {
  await requireCompanySession(formData.get("lang"));
  const parsed = parseReschedule(formData);
  if (!parsed.ok) return { status: "error", error: parsed.error };
  const result = await rescheduleJob(parsed.jobId, parsed.start, parsed.end);
  if (result.ok) refresh(parsed.lang);
  return stateOf(result);
}

/** "Cancelar trabalho": con motivo; libera vehículo y equipo. */
export async function cancelJobAction(_previous: ScheduleActionState, formData: FormData): Promise<ScheduleActionState> {
  await requireCompanySession(formData.get("lang"));
  const parsed = parseCancel(formData);
  if (!parsed.ok) return { status: "error", error: parsed.error };
  const result = await cancelJob(parsed.jobId, parsed.reason);
  if (result.ok) refresh(parsed.lang);
  return stateOf(result);
}
