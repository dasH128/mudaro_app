const stripSpaces = (value: string) => value.replace(/\s+/g, "");

/** Teléfono portugués: 9 dígitos, con o sin el prefijo +351 y con o sin espacios. */
export function isValidPtPhone(value: string): boolean {
  return /^(\+351)?\d{9}$/.test(stripSpaces(value));
}

/** "912 345 678" o "+351 912 345 678" -> "+351912345678". Devuelve null si no es un teléfono válido. */
export function normalizePtPhone(value: string): string | null {
  const compact = stripSpaces(value);
  if (!isValidPtPhone(compact)) return null;
  return compact.startsWith("+351") ? compact : `+351${compact}`;
}
