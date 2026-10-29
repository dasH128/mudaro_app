"use server";

import { redirect } from "next/navigation";

import { ROUTES, localePath } from "@/app/lib/routes";
import { setPasswordSchema } from "@/features/auth/application/schemas/invitation";
import { setInvitedUserPassword } from "@/features/auth/infrastructure/auth.repo";

import type { SetPasswordState } from "./state";

// Define la contraseña de la persona invitada. Vuelve a comprobar la sesión en servidor.
export async function setPasswordAction(_previous: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  const parsed = setPasswordSchema.safeParse({
    lang: formData.get("lang"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirm_password"),
  });
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some((issue) => issue.path[0] === "confirmPassword");
    return { status: "error", code: mismatch ? "mismatch" : "weak" };
  }

  const result = await setInvitedUserPassword(parsed.data.password);
  if (result === "unauthenticated") redirect(localePath(parsed.data.lang, ROUTES.auth.login));
  if (result === "failed") return { status: "error", code: "failed" };

  // Provisional: hasta que exista el asistente de configuración, vuelve al inicio.
  redirect(localePath(parsed.data.lang, ROUTES.home));
}
