import { DEFAULT_LOCALE, hasLocale, type Locale } from "./config";
import type { Dictionary } from "./get-dictionary";

type UnexpectedErrorText = Dictionary["app"]["errors"]["unexpected"];

/**
 * Excepción a "todos los textos en los diccionarios": copia de `app.errors.unexpected` para cuando el diccionario
 * no está disponible. La usa `global-error.tsx`, que sustituye al layout raíz, es de cliente y no puede cargar
 * los JSON sin meter los tres diccionarios enteros en el navegador. Si cambias esos textos, cámbialos aquí también.
 */
const TEXT: Record<Locale, UnexpectedErrorText> = {
  en: {
    title: "Something went wrong",
    text: "We couldn't load this page. Try again in a moment. If it keeps happening, send us the code below.",
    retry: "Try again",
    home: "Go to home",
    code: "Reference code: {code}",
  },
  es: {
    title: "Algo ha ido mal",
    text: "No hemos podido cargar esta página. Inténtalo de nuevo en unos momentos. Si sigue pasando, envíanos el código de abajo.",
    retry: "Intentar de nuevo",
    home: "Ir al inicio",
    code: "Código de referencia: {code}",
  },
  pt: {
    title: "Algo correu mal",
    text: "Não conseguimos carregar esta página. Tenta outra vez dentro de momentos. Se continuar, envia-nos o código abaixo.",
    retry: "Tentar novamente",
    home: "Ir para o início",
    code: "Código de referência: {code}",
  },
};

/** Idioma a partir del primer segmento de la ruta (/pt/...), o el de por defecto. */
export function localeFromPath(pathname: string): Locale {
  const first = pathname.split("/")[1] ?? "";
  return hasLocale(first) ? first : DEFAULT_LOCALE;
}

export function fallbackErrorText(locale: Locale): UnexpectedErrorText {
  return TEXT[locale];
}

/** `digest` de un error de servidor (Next lo añade para buscarlo en los logs). Los errores de cliente no lo tienen. */
export function errorDigest(error: unknown): string | null {
  if (error instanceof Error && "digest" in error && typeof error.digest === "string") return error.digest;
  return null;
}
