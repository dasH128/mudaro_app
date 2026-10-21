import type { Locale } from "@/app/i18n/config";

/**
 * Rutas de las vistas, centralizadas (sin prefijo de idioma).
 * Para navegar usar siempre localePath(lang, ROUTES.x) y nunca strings sueltos.
 */
export const ROUTES = {
  home: "/",
  auth: {
    login: "/login",
    register: "/registro",
    forgotPassword: "/recuperar-contrasena",
  },
} as const;

/** Antepone el idioma a una ruta de ROUTES: ("es", "/login") -> "/es/login". */
export function localePath(lang: Locale, route: string): string {
  return route === "/" ? `/${lang}` : `/${lang}${route}`;
}
