"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ROUTES, localePath } from "@/app/lib/routes";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { createCrewMember, setCrewMemberActive, updateCrewMember } from "../../infrastructure/team.repo";
import { parseCrew, parseCrewActive, readCrewId, type CrewActiveState, type CrewFormState } from "../schemas/crew";

// Personas del equipo (paso 6.0b). Cada acción comprueba sesión y rol en servidor (solo administradores),
// valida con zod y llama al repo; las funciones de la base de datos vuelven a comprobar el rol.

/** "Adicionar pessoa": da de alta la persona y vuelve a Equipa con su panel abierto. */
export async function createCrewAction(_previous: CrewFormState, formData: FormData): Promise<CrewFormState> {
  await requireCompanySession(formData.get("lang"));
  const parsed = parseCrew(formData);
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.fieldErrors };

  const created = await createCrewMember(parsed.data);
  if (!created.ok) return { status: "error", fieldErrors: {}, formError: created.error };

  redirect(`${localePath(parsed.lang, ROUTES.team.list)}?person=${encodeURIComponent(created.id)}`);
}

/** Guarda nombre, teléfono y función. El panel la llama al salir de cada campo. */
export async function updateCrewAction(_previous: CrewFormState, formData: FormData): Promise<CrewFormState> {
  await requireCompanySession(formData.get("lang"));
  const crewId = readCrewId(formData);
  if (!crewId) return { status: "error", fieldErrors: {}, formError: "notFound" };
  const parsed = parseCrew(formData);
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.fieldErrors };

  const saved = await updateCrewMember(crewId, parsed.data);
  if (!saved.ok) return { status: "error", fieldErrors: {}, formError: saved.error };

  revalidatePath(localePath(parsed.lang, ROUTES.team.list));
  return { status: "saved", at: Date.now() };
}

/** Activa o desactiva la persona. Desactivar exige motivo. */
export async function setCrewActiveAction(_previous: CrewActiveState, formData: FormData): Promise<CrewActiveState> {
  await requireCompanySession(formData.get("lang"));
  const parsed = parseCrewActive(formData);
  if (!parsed.ok) return { status: "error", formError: "failed" };

  const saved = await setCrewMemberActive(parsed.crewId, parsed.active, parsed.reason);
  if (!saved.ok) return { status: "error", formError: saved.error };

  revalidatePath(localePath(parsed.lang, ROUTES.team.list));
  return { status: "idle" };
}
