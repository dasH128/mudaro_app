import type { Locale } from "@/app/i18n/config";

// RNF-10: euros, fechas y números de Portugal, sea cual sea el idioma de la interfaz.
const NUMBER_LOCALE = "pt-PT";
const TIME_ZONE = "Europe/Lisbon";

const euro = new Intl.NumberFormat(NUMBER_LOCALE, {
  style: "currency",
  currency: "EUR",
  // pt-PT no agrupa los miles de 4 cifras por defecto; el diseño muestra "1 123,48 €"
  useGrouping: "always",
});
const decimal = new Intl.NumberFormat(NUMBER_LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat(NUMBER_LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIME_ZONE,
});
const time = new Intl.DateTimeFormat(NUMBER_LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});
// "en-CA" da el formato aaaa-mm-dd, que se puede comparar como texto
const day = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

/** Importe en céntimos → "1 123,48 €". */
export function formatEuro(cents: number): string {
  return euro.format(cents / 100);
}

/** Número con un decimal y coma: 38.4 → "38,4". */
export function formatDecimal(value: number): string {
  return decimal.format(value);
}

/** Volumen en metros cúbicos: 38.4 → "38,4 m³". */
export function formatVolume(m3: number): string {
  return `${decimal.format(m3)} m³`;
}

/** Proporción 0..1 → "64 %" (espacio de no separación, como en el diseño). */
export function formatPercent(ratio: number): string {
  return `${integer.format(ratio * 100)}\u00A0%`;
}

/** Fecha dd/mm/aaaa. Acepta una fecha ISO con hora o solo el día (aaaa-mm-dd). */
export function formatDate(value: string): string {
  return date.format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value));
}

/** "dd/mm" (sin año) de una fecha ISO. */
export function formatDayMonth(value: string): string {
  return formatDate(value).slice(0, 5);
}

/** Hora hh:mm de Lisboa. */
export function formatTime(iso: string): string {
  return time.format(new Date(iso));
}

/** Día de hoy en Lisboa, aaaa-mm-dd. */
export function todayLisbon(now: Date = new Date()): string {
  return day.format(now);
}

/** Día de Lisboa de un instante ISO, aaaa-mm-dd. */
export function dayLisbon(iso: string): string {
  return day.format(new Date(iso));
}

/** "há 3 h" / "3 hr. ago": tiempo relativo en el idioma de la interfaz. */
export function formatRelativeTime(locale: Locale, iso: string, now: Date = new Date()): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return rtf.format(-Math.max(minutes, 0), "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}
