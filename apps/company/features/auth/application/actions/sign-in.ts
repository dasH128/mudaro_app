"use server";

import { redirect } from "next/navigation";

import { ROUTES, localePath } from "@/app/lib/routes";
import { signInSchema } from "@/features/auth/application/schemas/credentials";
import { blockedReasonOf } from "@/features/auth/domain/session";
import { safeNextPath } from "@/features/auth/domain/redirect";
import { signInWithPassword } from "@/features/auth/infrastructure/auth.repo";
import { getCompanySession } from "@/features/auth/infrastructure/session.repo";

import type { SignInState } from "./state";

// Inicia sesión y comprueba en servidor que la cuenta es de un administrador de empresa activa.
// Si no lo es (empresa o cuenta desactivada, operario, cuenta sin empresa), va a la página de acceso bloqueado,
// que explica el motivo y ofrece cerrar la sesión. Esa sesión no ve datos del panel: RLS y requireCompanySession
// la frenan igual.
export async function signInAction(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    lang: formData.get("lang"),
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  // Mismo mensaje que credenciales erróneas: no se distingue qué campo falló.
  if (!parsed.success) return { status: "error", code: "invalid" };

  const result = await signInWithPassword(parsed.data.email, parsed.data.password);
  if (result !== "ok") return { status: "error", code: result };

  const { lang, next } = parsed.data;
  const current = await getCompanySession();
  if (current.status === "anonymous") return { status: "error", code: "failed" };
  if (blockedReasonOf(current)) redirect(localePath(lang, ROUTES.auth.noAccess));

  redirect(safeNextPath(next, lang, localePath(lang, ROUTES.home)));
}
