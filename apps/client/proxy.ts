import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, hasLocale, type Locale } from "@/app/i18n/config";

// La web del cliente no tiene sesión: el proxy solo pone el idioma. El enlace del pedido llega sin idioma
// (/p/<token>) y aquí se completa con el del navegador. Quién puede ver qué lo decide la Edge Function `client-order`
// con el token, no esta capa.

/** Primer idioma de Accept-Language (por q) que tengamos soportado. */
function fromAcceptLanguage(header: string | null): Locale | undefined {
  if (!header) return undefined;
  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((c) => c.tag && c.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    const base = tag.split("-")[0];
    if (hasLocale(base)) return base;
  }
  return undefined;
}

function getLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && hasLocale(cookie)) return cookie;
  return fromAcceptLanguage(request.headers.get("accept-language")) ?? DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = LOCALES.find((code) => pathname === `/${code}` || pathname.startsWith(`/${code}/`));
  if (locale) return NextResponse.next();

  // Reescritura y no redirección: el token no se repite en otra petición ni en el historial.
  const url = request.nextUrl.clone();
  url.pathname = `/${getLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Ignora _next y cualquier ruta con extensión (favicon.ico, imágenes, etc.)
  matcher: ["/((?!_next|.*\\..*).*)"],
};
