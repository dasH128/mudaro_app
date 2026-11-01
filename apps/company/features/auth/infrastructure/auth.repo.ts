import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

export type SetPasswordResult = "ok" | "unauthenticated" | "failed";
export type SignInResult = "ok" | "invalid" | "failed";

// Único acceso a Supabase Auth de esta feature: las acciones no importan @mudaro/supabase.

/** Canjea el token del enlace del email (invitación o recuperación) y deja la sesión creada. Devuelve false si no es válido. */
export async function verifyEmailToken(tokenHash: string, type: "invite" | "recovery"): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  return !error;
}

/** Inicia sesión con email y contraseña. "invalid" son credenciales erróneas; "failed", cualquier otro fallo (límite de intentos, red). */
export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return "ok";
  return error.code === "invalid_credentials" ? "invalid" : "failed";
}

/**
 * Pide el email de recuperación. Auth responde igual exista o no la cuenta, así que no se revela cuáles existen.
 * El enlace lo define la plantilla de Supabase (`/auth/confirm?token_hash=…&type=recovery`).
 */
export async function requestPasswordReset(email: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return !error;
}

/**
 * Crea la fila de company_users a partir de la invitación vigente de quien tiene sesión (migración accept_invitation).
 * Es idempotente. Devuelve false si falla la llamada; sin invitación vigente tampoco hay error, y la sesión de empresa
 * no existirá, cosa que detecta `requireCompanySession`.
 */
export async function acceptInvitation(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("accept_invitation");
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
