"use server";

import { redirect } from "next/navigation";

import { ROUTES, localePath } from "@/app/lib/routes";
import { confirmInvitationSchema } from "@/features/auth/schemas/invitation";
import { createSupabaseServerClient } from "@mudaro/supabase/server";

import type { ConfirmInvitationState } from "./state";

// Valida el token del enlace al pulsar el botón (no al abrir la página) y crea la sesión.
export async function confirmInvitationAction(
  _previous: ConfirmInvitationState,
  formData: FormData,
): Promise<ConfirmInvitationState> {
  const parsed = confirmInvitationSchema.safeParse({
    lang: formData.get("lang"),
    tokenHash: formData.get("token_hash"),
  });
  if (!parsed.success) return { status: "error", code: "invalid" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type: "invite", token_hash: parsed.data.tokenHash });
  if (error) return { status: "error", code: "invalid" };

  redirect(localePath(parsed.data.lang, ROUTES.auth.setPassword));
}
