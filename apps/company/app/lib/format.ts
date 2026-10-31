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
const euroWhole = new Intl.NumberFormat(NUMBER_LOCALE, {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
});
const decimal = new Intl.NumberFormat(NUMBER_LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 0 });
// Enteros con separador de miles (también de 4 cifras): "6 000"
const grouped = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 0, useGrouping: "always" });
// Hasta un decimal, sin ceros de relleno: 25 → "25", 12.5 → "12,5"
const compact = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 1 });
const amount = new Intl.NumberFormat(NUMBER_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

/** Importe en céntimos redondeado a euros enteros, para listas y resúmenes: 487000 → "4 870 €". */
export function formatEuroWhole(cents: number): string {
  return euroWhole.format(cents / 100);
}

/** Número con un decimal y coma: 38.4 → "38,4". */
export function formatDecimal(value: number): string {
  return decimal.format(value);
}

/** Volumen en metros cúbicos: 38.4 → "38,4 m³". */
export function formatVolume(m3: number): string {
  return `${decimal.format(m3)} m³`;
}

/** Entero con separador de miles: 6000 → "6 000". */
export function formatInteger(value: number): string {
  return grouped.format(value);
}

/** Número con hasta un decimal y sin ceros de relleno: 25 → "25", 12.5 → "12,5". */
export function formatCompact(value: number): string {
  return compact.format(value);
}

/** Metros cúbicos sin decimales de relleno: 25 → "25 m³", 12.5 → "12,5 m³". */
export function formatCubicMeters(m3: number): string {
  return `${compact.format(m3)} m³`;
}

/** Importe en céntimos sin símbolo: 45 → "0,45". */
export function formatAmount(cents: number): string {
  return amount.format(cents / 100);
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

/** "dd/mm/aaaa, hh:mm" (hora de Lisboa) de un instante ISO. */
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

/** "dd/mm · hh:mm" (hora de Lisboa) de un instante ISO. */
export function formatDayMonthTime(iso: string): string {
  return `${formatDayMonth(iso)} · ${formatTime(iso)}`;
}

/** "+351913334455" → "913 334 455". Un texto que no tenga ese formato se devuelve tal cual. */
export function formatPhone(normalized: string): string {
  const match = /^\+351(\d{3})(\d{3})(\d{3})$/.exec(normalized);
  return match ? `${match[1]} ${match[2]} ${match[3]}` : normalized;
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

/** Fecha ISO con hora o solo día (aaaa-mm-dd) → Date. El día suelto se lee a mediodía UTC para no cambiar de día. */
function toDate(value: string): Date {
  return new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
}

function upperFirst(text: string): string {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

/** Nombre del mes en el idioma de la interfaz: "2026-12-01" → "Dezembro". */
export function formatMonthName(locale: Locale, value: string): string {
  return upperFirst(new Intl.DateTimeFormat(locale, { month: "long", timeZone: TIME_ZONE }).format(toDate(value)));
}

/** Mes corto y año para "cliente desde": "2026-09-07" → "set 2026". */
export function formatMonthYear(locale: Locale, value: string): string {
  const when = toDate(value);
  const month = new Intl.DateTimeFormat(locale, { month: "short", timeZone: TIME_ZONE }).format(when).replace(/\.$/, "");
  const year = new Intl.DateTimeFormat(NUMBER_LOCALE, { year: "numeric", timeZone: TIME_ZONE }).format(when);
  return `${month} ${year}`;
}

/** Día y mes corto para las fichas de agenda: "2026-11-05" → { day: "05", month: "nov" }. */
export function formatDayMonthShort(locale: Locale, value: string): { day: string; month: string } {
  const when = toDate(value);
  return {
    day: new Intl.DateTimeFormat(NUMBER_LOCALE, { day: "2-digit", timeZone: TIME_ZONE }).format(when),
    month: new Intl.DateTimeFormat(locale, { month: "short", timeZone: TIME_ZONE }).format(when).replace(/\.$/, ""),
  };
}

/** "Quinta-feira, 29 de outubro": día de la semana, día y mes largos en el idioma de la interfaz. */
export function formatLongDate(locale: Locale, now: Date = new Date()): string {
  return upperFirst(
    new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: TIME_ZONE }).format(now),
  );
}

/** "Sábado, 31 de outubro de 2026": día de la semana, día, mes y año largos en el idioma de la interfaz. */
export function formatFullDate(locale: Locale, now: Date = new Date()): string {
  return upperFirst(
    new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TIME_ZONE }).format(now),
  );
}

/** Día de la semana corto: "2026-10-26" → "Seg". */
export function formatWeekdayShort(locale: Locale, value: string): string {
  return upperFirst(new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: TIME_ZONE }).format(toDate(value)).replace(/\.$/, ""));
}

/** "26 out – 1 nov 2026": rango de días con mes corto; el año va al final. */
export function formatDateRange(locale: Locale, from: string, to: string): string {
  const short = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: TIME_ZONE });
  const year = new Intl.DateTimeFormat(NUMBER_LOCALE, { year: "numeric", timeZone: TIME_ZONE }).format(toDate(to));
  const clean = (value: string) => value.replace(/\./g, "").replace(/\sde\s/g, " ");
  return `${clean(short.format(toDate(from)))} – ${clean(short.format(toDate(to)))} ${year}`;
}

/** "Sexta-feira, 30 out 2026": día de la semana, día, mes corto y año. */
export function formatDayWithYear(locale: Locale, value: string): string {
  const when = toDate(value);
  const weekday = upperFirst(new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: TIME_ZONE }).format(when));
  const rest = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE }).format(when);
  return `${weekday}, ${rest.replace(/\./g, "").replace(/\sde\s/g, " ")}`;
}

/** "Novembro 2026": mes largo y año. */
export function formatMonthWithYear(locale: Locale, value: string): string {
  return `${formatMonthName(locale, value)} ${new Intl.DateTimeFormat(NUMBER_LOCALE, { year: "numeric", timeZone: TIME_ZONE }).format(toDate(value))}`;
}

/** Día de la semana en el idioma de la interfaz: "2026-11-20" → "Sexta-feira". */
export function formatWeekday(locale: Locale, value: string): string {
  return upperFirst(new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: TIME_ZONE }).format(toDate(value)));
}

/** Día de la semana corto y número de día para el gráfico semanal: "2026-10-30" → "Sex 30". */
export function formatWeekdayDay(locale: Locale, value: string): string {
  const when = toDate(value);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: TIME_ZONE }).format(when).replace(/\.$/, "");
  const dayOfMonth = new Intl.DateTimeFormat(NUMBER_LOCALE, { day: "numeric", timeZone: TIME_ZONE }).format(when);
  return `${upperFirst(weekday)} ${dayOfMonth}`;
}

/** Hora (0-23) de Lisboa, para el saludo. */
export function hourLisbon(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: TIME_ZONE }).format(now));
}
