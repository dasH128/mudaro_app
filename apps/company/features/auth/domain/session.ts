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

/** Resultado de leer la sesión: sin login, con login pero sin empresa activa, o sesión de empresa. */
export type SessionResult =
  | { status: "anonymous" }
  | { status: "no-company" }
  | { status: "ok"; session: CompanySession };

/** Solo el administrador entra en el panel web; el operario usa la app móvil (architecture-system.md). */
export function canAccessPanel(role: CompanyRole): boolean {
  return role === "administrator";
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
