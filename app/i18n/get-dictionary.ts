import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import en from "./dictionaries/en.json";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "./config";

export type Dictionary = typeof en;

type Plain = { [key: string]: unknown };

const isPlain = (v: unknown): v is Plain =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Mezcla `override` sobre `base`: las claves que faltan caen al inglés. */
function merge(base: Plain, override: Plain): Plain {
  const out: Plain = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] = isPlain(current) && isPlain(value) ? merge(current, value) : value;
  }
  return out;
}

export async function loadDictionary(locale: Locale): Promise<Dictionary> {
  if (locale === DEFAULT_LOCALE) return en;
  const dict = await import(`./dictionaries/${locale}.json`).then((m) => m.default);
  return merge(en as Plain, dict as Plain) as Dictionary;
}

/** Diccionario del idioma de la URL (/[lang]). Sin argumentos. */
export async function getDictionary(): Promise<Dictionary> {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return loadDictionary(locale);
}
