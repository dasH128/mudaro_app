// Matrículas de Portugal: tres pares separados por guion, cada par de dos letras o de dos cifras
// (AA-00-AA, 00-AA-00, 00-00-AA, AA-00-00). Lógica pura.

const PAIR = /^(?:[A-Z]{2}|\d{2})$/;
const LETTERS = /^[A-Z]{2}$/;

/** Quita espacios y guiones y pasa a mayúsculas: "at 45-rs" → "AT45RS". Sirve para comparar matrículas. */
export function compactPlate(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

/** "at45rs" → "AT-45-RS". Devuelve `null` si no tiene un formato de matrícula portuguesa. */
export function normalizePlate(input: string): string | null {
  const compact = compactPlate(input);
  if (compact.length !== 6) return null;

  const pairs = [compact.slice(0, 2), compact.slice(2, 4), compact.slice(4, 6)];
  if (!pairs.every((pair) => PAIR.test(pair))) return null;
  // Una matrícula mezcla letras y cifras: no vale "AB-CD-EF" ni "12-34-56"
  const letterPairs = pairs.filter((pair) => LETTERS.test(pair)).length;
  if (letterPairs === 0 || letterPairs === 3) return null;

  return pairs.join("-");
}
