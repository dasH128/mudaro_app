"use server";

import { redirect } from "next/navigation";

import { ROUTES, localePath } from "@/app/lib/routes";
import { signInSchema } from "@/features/auth/application/schemas/credentials";
import { canAccessPanel } from "@/features/auth/domain/session";
import { safeNextPath } from "@/features/auth/domain/redirect";
import { signInWithPassword, signOutCurrentUser } from "@/features/auth/infrastructure/auth.repo";
import { getCompanySession } from "@/features/auth/infrastructure/session.repo";

import type { SignInState } from "./state";

// Inicia sesión y comprueba en servidor que la cuenta es de un administrador de empresa activa.
// Un operario, un usuario desactivado o una cuenta sin empresa no se quedan con la sesión abierta.
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

  const current = await getCompanySession();
  if (current.status !== "ok" || !canAccessPanel(current.session.role)) {
    await signOutCurrentUser();
    return { status: "error", code: "noAccess" };
  }

  const { lang, next } = parsed.data;
  redirect(safeNextPath(next, lang, localePath(lang, ROUTES.home)));
}
