/**
 * Idiomas soportados. Para añadir uno: crear app/i18n/dictionaries/<code>.json
 * y añadir el código aquí.
 */
export const LOCALES = ["en", "es", "pt"] as const;

export type Locale = (typeof LOCALES)[number];

/** Idioma por defecto y de respaldo cuando el pedido no está soportado. */
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const hasLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);
