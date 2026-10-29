/**
 * NIF portugués: 9 dígitos, el último es el dígito de control (módulo 11).
 * No restringe el primer dígito, para admitir también empresarios en nombre individual.
 * Debe coincidir con `is_valid_tax_id` de la base de datos (supabase/migrations).
 */
export function isValidTaxId(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;

  const digits = Array.from(value, Number);
  const sum = digits.slice(0, 8).reduce((acc, digit, i) => acc + digit * (9 - i), 0);
  const remainder = sum % 11;
  const check = remainder < 2 ? 0 : 11 - remainder;

  return check === digits[8];
}
