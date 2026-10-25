import "server-only";

import { createSupabaseServerClient, type SupabaseServerClient } from "@mudaro/supabase/server";

/**
 * Único acceso a Supabase Auth y a `platform_users` desde el panel.
 * Los tipos de la base de datos no salen de esta capa.
 */

/**
 * Dónde está la sesión actual en el flujo de entrada.
 * - `signed-out`: sin sesión válida.
 * - `code`: contraseña correcta y MFA activado, falta el código (aal1 con factor).
 * - `enroll`: contraseña correcta pero sin MFA todavía (aal1 sin factor).
 * - `ready`: sesión con MFA verificado (aal2).
 */
export type AuthStep = "signed-out" | "code" | "enroll" | "ready";

export type PlatformUserRow = { id: string; name: string };

export type Enrollment = { factorId: string; qrCode: string; secret: string };

export async function signInWithPassword(email: string, password: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}

export async function getAuthStep(): Promise<AuthStep> {
  const supabase = await createSupabaseServerClient();

  // getUser consulta a Auth y no se fía solo de la cookie.
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return "signed-out";

  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return "signed-out";

  if (data.currentLevel === "aal2") return "ready";
  return data.nextLevel === "aal2" ? "code" : "enroll";
}

/**
 * Fila de `platform_users` de la sesión. RLS solo la devuelve con aal2 y usuario activo,
 * así que `null` también cubre "sin MFA verificado".
 */
export async function findPlatformUser(): Promise<PlatformUserRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data } = await supabase
    .from("platform_users")
    .select("id, name")
    .eq("id", userData.user.id)
    .eq("active", true)
    .maybeSingle();

  return data;
}

async function verifiedTotpFactorId(supabase: SupabaseServerClient): Promise<string | null> {
  const { data } = await supabase.auth.mfa.listFactors();
  // `totp` solo incluye factores ya verificados.
  return data?.totp[0]?.id ?? null;
}

export type VerifyResult = "ok" | "invalid" | "no-factor";

/** Segundo paso del login: valida el código contra el factor TOTP verificado. */
export async function verifyTotp(code: string): Promise<VerifyResult> {
  const supabase = await createSupabaseServerClient();

  const factorId = await verifiedTotpFactorId(supabase);
  if (!factorId) return "no-factor";

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  return error ? "invalid" : "ok";
}

/**
 * Crea un factor TOTP sin verificar y devuelve el QR y el secreto.
 * Se niega si ya hay un factor verificado: quien solo tenga la contraseña no puede añadir el suyo.
 */
export async function startTotpEnrollment(): Promise<Enrollment | null> {
  const supabase = await createSupabaseServerClient();

  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (!factors || factors.totp.length > 0) return null;

  // Limpia intentos anteriores sin confirmar (si no, el nombre del factor chocaría).
  for (const factor of factors.all) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "Mudaro",
    friendlyName: "Painel Mudaro",
  });
  if (error || !data) return null;

  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

/** Confirma el factor con el primer código. Si es correcto, la sesión pasa a aal2. */
export async function confirmTotpEnrollment(factorId: string, code: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  return !error;
}
