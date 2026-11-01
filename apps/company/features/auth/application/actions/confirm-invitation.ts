"use server";

import { redirect } from "next/navigation";

import { ROUTES, localePath } from "@/app/lib/routes";
import { confirmInvitationSchema } from "@/features/auth/application/schemas/invitation";
import { verifyEmailToken } from "@/features/auth/infrastructure/auth.repo";

import type { ConfirmInvitationState } from "./state";

// Valida el token del enlace (invitación o recuperación) al pulsar el botón (no al abrir la página) y crea la sesión.
export async function confirmInvitationAction(
  _previous: ConfirmInvitationState,
  formData: FormData,
): Promise<ConfirmInvitationState> {
  const parsed = confirmInvitationSchema.safeParse({
    lang: formData.get("lang"),
    tokenHash: formData.get("token_hash"),
    type: formData.get("type"),
  });
  if (!parsed.success) return { status: "error", code: "invalid" };

  const valid = await verifyEmailToken(parsed.data.tokenHash, parsed.data.type);
  if (!valid) return { status: "error", code: "invalid" };

  redirect(localePath(parsed.data.lang, ROUTES.auth.setPassword));
}
