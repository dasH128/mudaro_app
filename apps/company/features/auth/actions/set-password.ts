"use server";

import { redirect } from "next/navigation";

import { ROUTES, localePath } from "@/app/lib/routes";
import { setPasswordSchema } from "@/features/auth/schemas/invitation";
import { createSupabaseServerClient } from "@mudaro/supabase/server";

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

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(localePath(parsed.data.lang, ROUTES.auth.login));

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", code: "failed" };

  // Provisional: hasta que exista el asistente de configuración, vuelve al inicio.
  redirect(localePath(parsed.data.lang, ROUTES.home));
}
