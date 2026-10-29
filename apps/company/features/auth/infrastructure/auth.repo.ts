import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

export type SetPasswordResult = "ok" | "unauthenticated" | "failed";

// Único acceso a Supabase Auth de esta feature: las acciones no importan @mudaro/supabase.

/** Canjea el token del enlace de invitación y deja la sesión creada. Devuelve false si no es válido. */
export async function verifyInvitationToken(tokenHash: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type: "invite", token_hash: tokenHash });
  return !error;
}

/** Define la contraseña de quien tiene sesión. Comprueba la sesión en servidor antes de escribir. */
export async function setInvitedUserPassword(password: string): Promise<SetPasswordResult> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return "unauthenticated";

  const { error } = await supabase.auth.updateUser({ password });
  return error ? "failed" : "ok";
}

/** Cierra la sesión actual (borra las cookies de Supabase Auth). */
export async function signOutCurrentUser(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
