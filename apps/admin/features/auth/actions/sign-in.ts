"use server";

import { redirect } from "next/navigation";

import { routeForAuthStep } from "@/app/lib/auth";
import { getAuthStep, signInWithPassword } from "@/features/auth/data/auth.repo";
import { signInSchema } from "@/features/auth/schemas/auth";

import { CREDENTIALS_ERROR, type AuthActionState } from "./state";

// Primer paso del login: email y contraseña. Después, según la sesión, va al código, al
// alta del MFA o directamente al panel.
export async function signInAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail : "";

  const parsed = signInSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success || !(await signInWithPassword(parsed.data.email, parsed.data.password))) {
    return { status: "error", message: CREDENTIALS_ERROR, email };
  }

  redirect(routeForAuthStep(await getAuthStep()));
}
