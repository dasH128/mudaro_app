"use server";

import { forgotPasswordSchema } from "@/features/auth/application/schemas/credentials";
import { requestPasswordReset } from "@/features/auth/infrastructure/auth.repo";

import type { ForgotPasswordState } from "./state";

// Pide el email de recuperación. La respuesta es la misma exista o no la cuenta.
export async function forgotPasswordAction(
  _previous: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ lang: formData.get("lang"), email: formData.get("email") });
  if (!parsed.success) return { status: "error", code: "invalid" };

  const sent = await requestPasswordReset(parsed.data.email);
  return sent ? { status: "sent" } : { status: "error", code: "failed" };
}
