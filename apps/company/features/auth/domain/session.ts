/** Rol de un usuario de empresa. Mismos valores que el enum `company_role` de la base de datos. */
export type CompanyRole = "administrator" | "operator";

export type CompanySession = {
  userId: string;
  email: string;
  name: string;
  role: CompanyRole;
  companyId: string;
  companyName: string;
};

/**
 * Por qué una sesión no puede usar el panel. Cada motivo lo resuelve una persona distinta:
 * - `company`: la empresa está desactivada (RF-68). Habla con Mudaro.
 * - `account`: la cuenta del usuario está desactivada (RF-04). Habla con el administrador de su empresa.
 * - `role`: es operario; el panel web es solo para administradores. Usa la app móvil.
 * - `none`: la cuenta no está ligada a ninguna empresa (p. ej. un usuario de plataforma). Habla con Mudaro.
 */
export type BlockedReason = "company" | "account" | "role" | "none";

/**
 * Resultado de leer la sesión: sin login, con login pero bloqueada, o sesión de empresa.
 * El rol no se decide aquí: un operario con empresa activa es `ok` y lo bloquea `blockedReasonOf`.
 */
export type SessionResult =
  | { status: "anonymous" }
  | { status: "blocked"; reason: Exclude<BlockedReason, "role"> }
  | { status: "ok"; session: CompanySession };

/** Solo el administrador entra en el panel web; el operario usa la app móvil (architecture-system.md). */
export function canAccessPanel(role: CompanyRole): boolean {
  return role === "administrator";
}

/** Motivo por el que una sesión iniciada no entra en el panel, o `null` si puede entrar. */
export function blockedReasonOf(result: Exclude<SessionResult, { status: "anonymous" }>): BlockedReason | null {
  if (result.status === "blocked") return result.reason;
  return canAccessPanel(result.session.role) ? null : "role";
}

/** Iniciales para el avatar: primera letra de las dos primeras palabras. */
export function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase());
  return letters.join("") || "?";
}

/** Primer nombre, para el saludo. */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
