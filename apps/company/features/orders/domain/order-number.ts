// Número visible de un pedido. TypeScript puro: sin React, Next ni Supabase.
// El pedido se identifica por el número de su envío (`shipments.number`), una secuencia propia de cada empresa.
// El prefijo "MD-" y el relleno con ceros los pone la interfaz: en la base de datos solo hay un entero.

const PREFIX = "MD-";

/** 836 → "MD-0836". */
export function formatOrderNumber(number: number): string {
  return `${PREFIX}${String(number).padStart(4, "0")}`;
}

/** "MD-0836" → 836. Devuelve `null` si no tiene ese formato (así una ruta inventada no llega a la consulta). */
export function parseOrderNumber(id: string): number | null {
  const match = /^MD-(\d{1,9})$/.exec(id);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}
