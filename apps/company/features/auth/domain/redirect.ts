/**
 * Destino tras el login (`?next=`). Solo se admiten rutas internas del mismo idioma:
 * cualquier otra cosa (URL absoluta, `//host`, barras invertidas) cae en `fallback`.
 */
export function safeNextPath(next: unknown, lang: string, fallback: string): string {
  if (typeof next !== "string" || next.length > 512) return fallback;
  const prefix = `/${lang}`;
  const internal =
    (next === prefix || next.startsWith(`${prefix}/`) || next.startsWith(`${prefix}?`)) &&
    !next.includes("//") &&
    !next.includes("\\") &&
    !/[\u0000-\u001f]/.test(next);
  return internal ? next : fallback;
}
