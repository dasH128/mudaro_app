"use server";

import { redirect } from "next/navigation";

import { routeForAuthStep } from "@/app/lib/auth";
import { ROUTES } from "@/app/lib/routes";
import { getAuthStep, verifyTotp } from "@/features/auth/data/auth.repo";
import { codeSchema } from "@/features/auth/schemas/auth";

import { CODE_FORMAT_ERROR, CODE_INVALID_ERROR, type AuthActionState } from "./state";

// Segundo paso del login: código TOTP de la app de autenticación.
export async function verifyCodeAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = codeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { status: "error", message: CODE_FORMAT_ERROR };

  const result = await verifyTotp(parsed.data.code);
  // Sin sesión o sin factor: la sesión dice a qué paso volver.
  if (result === "no-factor") redirect(routeForAuthStep(await getAuthStep()));
  if (result === "invalid") return { status: "error", message: CODE_INVALID_ERROR };

  redirect(ROUTES.empresas.list);
}
