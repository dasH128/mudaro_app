import { updateSession } from "@mudaro/supabase/proxy";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, hasLocale, type Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";

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

/** Rutas que se pueden abrir sin sesión (sin prefijo de idioma). */
const PUBLIC_ROUTES = [ROUTES.auth.login, ROUTES.auth.register, ROUTES.auth.forgotPassword, ROUTES.auth.confirm, ROUTES.auth.setPassword];

function isPublicRoute(pathname: string, locale: Locale): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === localePath(locale, route));
}

// Primero el idioma; después refresca la sesión y manda a /login a quien no tiene ninguna.
// No decide permisos: sesión y rol se vuelven a comprobar en cada página y acción (`requireCompanySession`) y en RLS.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = LOCALES.find((code) => pathname === `/${code}` || pathname.startsWith(`/${code}/`));

  if (!locale) {
    request.nextUrl.pathname = `/${getLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  const { response, hasSession } = await updateSession(request);
  if (hasSession || isPublicRoute(pathname, locale)) return response;

  // Se guarda el destino (ruta y query) para volver tras entrar; el login lo valida otra vez.
  const login = new URL(localePath(locale, ROUTES.auth.login), request.url);
  login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  const redirect = NextResponse.redirect(login);
  // Conserva las cookies de sesión que Supabase haya renovado en esta petición.
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  // Ignora _next y cualquier ruta con extensión (favicon.ico, imágenes, etc.)
  matcher: ["/((?!_next|.*\\..*).*)"],
};
