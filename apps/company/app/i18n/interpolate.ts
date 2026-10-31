import type { Locale } from "./config";

/** Sustituye {nombre} por su valor. Una clave sin valor se deja tal cual. */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

/** Textos en singular y plural: la forma la elige la regla del idioma. */
export type PluralForms = { one: string; other: string };

export function pluralize(locale: Locale, count: number, forms: PluralForms, values: Record<string, string | number> = {}): string {
  // El idioma "pt" es portugués de Portugal: en él, el 0 va en plural ("0 clientes"), a diferencia del de Brasil
  const rules = new Intl.PluralRules(locale === "pt" ? "pt-PT" : locale);
  const form = rules.select(count) === "one" ? forms.one : forms.other;
  return interpolate(form, { count, ...values });
}
