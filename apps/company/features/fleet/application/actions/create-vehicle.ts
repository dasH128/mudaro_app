"use server";

import { redirect } from "next/navigation";

import { loadDictionary } from "@/app/i18n/get-dictionary";
import { todayLisbon } from "@/app/lib/format";
import { MOCK_USER } from "@/app/lib/mock-session";
import { ROUTES, localePath } from "@/app/lib/routes";
import { createVehicle } from "../../infrastructure/fleet.repo";
import { parseNewVehicle, readIntent, readValues } from "../schemas/new-vehicle";

import type { FormState } from "./state";

// RF-05: dar de alta un vehículo.
export async function createVehicleAction(_previous: FormState, formData: FormData): Promise<FormState> {
  // TODO(auth): el grupo (app) aún no tiene sesión. Antes de conectar datos reales, aquí se comprueba
  // sesión y rol en servidor (una Server Action es un endpoint público; solo administradores, RNF-03), además de RLS.
  const parsed = parseNewVehicle(readValues(formData), readIntent(formData));
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.fieldErrors };

  const { lang, vehicle, intent } = parsed.data;
  const dict = await loadDictionary(lang);
  const created = await createVehicle(
    { ...vehicle, typeLabel: dict.app.fleet.new.types[vehicle.type].label, by: MOCK_USER.name },
    { today: todayLisbon() },
  );
  if (!created.ok) return { status: "error", fieldErrors: { plate: created.error } };

  // Con "criar outro" se vuelve al formulario en blanco, avisando de lo añadido
  const next = intent === "another" ? `${localePath(lang, ROUTES.fleet.new)}?added=${encodeURIComponent(created.vehicle.id)}` : `${localePath(lang, ROUTES.fleet.list)}?vehicle=${encodeURIComponent(created.vehicle.id)}`;
  redirect(next);
}
