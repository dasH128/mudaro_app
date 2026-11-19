/**
 * Idiomas soportados. Para añadir uno: crear app/i18n/dictionaries/<code>.json
 * y añadir el código aquí. `en.json` es la base de tipos; `es` y `pt` caen al inglés si falta una clave.
 */
export const LOCALES = ["en", "es", "pt"] as const;

export type Locale = (typeof LOCALES)[number];

/** Los clientes del piloto son de Portugal: sin idioma reconocido, la web sale en portugués (RNF-10). */
export const DEFAULT_LOCALE: Locale = "pt";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const hasLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);
