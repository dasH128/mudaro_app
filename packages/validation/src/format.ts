// RNF-10: fechas y números de Portugal, sea cual sea el idioma de la interfaz. Los usan apps/company y apps/client.

const NUMBER_LOCALE = "pt-PT";
const TIME_ZONE = "Europe/Lisbon";

const decimal = new Intl.NumberFormat(NUMBER_LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
// Hasta un decimal, sin ceros de relleno: 25 → "25", 12.5 → "12,5"
const compact = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 1 });
const euro = new Intl.NumberFormat(NUMBER_LOCALE, {
  style: "currency",
  currency: "EUR",
  // pt-PT no agrupa los miles de 4 cifras por defecto; el diseño muestra "1 123,48 €"
  useGrouping: "always",
});
const date = new Intl.DateTimeFormat(NUMBER_LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIME_ZONE,
});

/** Número con un decimal y coma: 38.4 → "38,4". */
export function formatDecimal(value: number): string {
  return decimal.format(value);
}

/** Volumen en metros cúbicos: 38.4 → "38,4 m³". */
export function formatVolume(m3: number): string {
  return `${decimal.format(m3)} m³`;
}

/** Fecha dd/mm/aaaa. Acepta una fecha ISO con hora o solo el día (aaaa-mm-dd). */
export function formatDate(value: string): string {
  return date.format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value));
}

/** Hasta un decimal, sin ceros de relleno: 25 → "25", 12.5 → "12,5". */
export function formatCompact(value: number): string {
  return compact.format(value);
}

/** Importe en céntimos → "1 123,48 €". */
export function formatEuro(cents: number): string {
  return euro.format(cents / 100);
}
