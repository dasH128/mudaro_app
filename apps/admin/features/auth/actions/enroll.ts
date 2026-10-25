"use server";

import { redirect } from "next/navigation";

import { routeForAuthStep } from "@/app/lib/auth";
import { ROUTES } from "@/app/lib/routes";
import { confirmTotpEnrollment, getAuthStep, startTotpEnrollment } from "@/features/auth/data/auth.repo";
import { confirmEnrollmentSchema } from "@/features/auth/schemas/auth";

import {
  CODE_FORMAT_ERROR,
  CODE_INVALID_ERROR,
  ENROLL_ERROR,
  type AuthActionState,
  type EnrollState,
} from "./state";

// Solo se puede activar el MFA con contraseña correcta y sin ningún factor verificado.
// Si ya hay uno (`code`) o la sesión ya es aal2 (`ready`), se devuelve al paso que toca.
async function requireEnrollStep() {
  const step = await getAuthStep();
  if (step !== "enroll") redirect(routeForAuthStep(step));
}

export async function startEnrollmentAction(): Promise<EnrollState> {
  await requireEnrollStep();

  const enrollment = await startTotpEnrollment();
  if (!enrollment) return { status: "error", message: ENROLL_ERROR };

  return { status: "enrolling", ...enrollment };
}

export async function confirmEnrollmentAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  await requireEnrollStep();

  const parsed = confirmEnrollmentSchema.safeParse({
    factorId: formData.get("factorId"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { status: "error", message: CODE_FORMAT_ERROR };

  if (!(await confirmTotpEnrollment(parsed.data.factorId, parsed.data.code))) {
    return { status: "error", message: CODE_INVALID_ERROR };
  }

  redirect(ROUTES.empresas.list);
}
