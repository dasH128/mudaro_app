"use server";

import { redirect } from "next/navigation";

import { DEFAULT_LOCALE, hasLocale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { signOutCurrentUser } from "@/features/auth/infrastructure/auth.repo";

// Cierra la sesión y lleva al login. El idioma viene del formulario: se valida antes de usarlo en la redirección.
export async function signOutAction(formData: FormData): Promise<void> {
  const lang = formData.get("lang");
  await signOutCurrentUser();
  redirect(localePath(typeof lang === "string" && hasLocale(lang) ? lang : DEFAULT_LOCALE, ROUTES.auth.login));
}
