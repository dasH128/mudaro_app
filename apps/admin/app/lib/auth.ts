import "server-only";

export type PlatformUser = {
  name: string;
};

/**
 * Comprueba en servidor que hay sesión y que el usuario tiene rol `plataforma`.
 *
 * TODO(auth): PROVISIONAL. Todavía no hay Supabase Auth, así que no comprueba nada y
 * devuelve un usuario ficticio. Sustituir por la comprobación real (sesión + rol
 * `plataforma` + MFA, con `redirect("/login")` si falla) ANTES de conectar datos reales
 * o desplegar. Ver apps/admin/CLAUDE.md.
 */
export async function requirePlatformUser(): Promise<PlatformUser> {
  return { name: "Equipa Mudaro" };
}
