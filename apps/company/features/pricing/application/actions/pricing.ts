"use server";

import { revalidatePath } from "next/cache";

import { ROUTES, localePath } from "@/app/lib/routes";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { saveCompanyExtra, saveTariff } from "../../infrastructure/pricing.repo";
import { parseExtra, readExtraValues, type ExtraFormState } from "../schemas/extra";
import { parseTariff, readTariffValues, type TariffFormState } from "../schemas/tariff";

// Tarifas (RF-06, RF-07). Cada acción comprueba sesión y rol (solo administradores, RNF-03), valida con zod y llama al
// repo; las funciones de la base de datos vuelven a comprobar el rol.

/** "Guardar nova versão": crea la versión siguiente de la tarifa. */
export async function saveTariffAction(_previous: TariffFormState, formData: FormData): Promise<TariffFormState> {
  await requireCompanySession(formData.get("lang"));
  const parsed = parseTariff(readTariffValues(formData));
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.fieldErrors };

  const saved = await saveTariff(parsed.tariff);
  if (!saved.ok) return { status: "error", fieldErrors: { form: saved.error === "notAllowed" ? "notAllowed" : saved.error === "invalid" ? "invalid" : "failed" } };

  revalidatePath(localePath(parsed.lang, ROUTES.pricing));
  return { status: "saved", version: saved.version };
}

/** Alta o edición de un servicio extra. Activar o desactivar usa la misma acción con el resto de datos sin cambios. */
export async function saveExtraAction(_previous: ExtraFormState, formData: FormData): Promise<ExtraFormState> {
  await requireCompanySession(formData.get("lang"));
  const parsed = parseExtra(readExtraValues(formData));
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.fieldErrors };

  const saved = await saveCompanyExtra(parsed.data.id, parsed.data.extra);
  if (!saved.ok) {
    return { status: "error", fieldErrors: saved.error === "nameTaken" ? { name: "nameTaken" } : { form: saved.error } };
  }

  revalidatePath(localePath(parsed.data.lang, ROUTES.pricing));
  return { status: "saved", id: saved.id };
}
