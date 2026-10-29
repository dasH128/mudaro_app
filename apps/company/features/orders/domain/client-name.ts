/** Primer nombre para saludar: "Ana Ribeiro" -> "Ana". Vacío si no hay nombre. */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

/** Iniciales para el avatar: "Ana Ribeiro" -> "AR", "TechHub" -> "T". */
export function initials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
