import type { Locale } from "@/app/i18n/config";

/**
 * Rutas de las vistas, centralizadas (sin prefijo de idioma).
 * Para navegar usar siempre localePath(lang, ROUTES.x) y nunca strings sueltos
 * (ni en href, ni en redirect, ni en el proxy). Una ruta nueva se declara aquí primero.
 */
export const ROUTES = {
  home: "/",
  auth: {
    login: "/login",
    register: "/registro",
    forgotPassword: "/recuperar-contrasena",
    confirm: "/auth/confirm",
    setPassword: "/auth/set-password",
  },
  orders: { list: "/orders", new: "/orders/new" },
  proposals: {
    list: "/proposals",
    new: "/proposals/new",
    detail: (id: string) => `/proposals/${encodeURIComponent(id)}`,
  },
  schedule: "/schedule",
  clients: "/clients",
  fleet: "/fleet",
  team: "/team",
  pricing: "/pricing",
  reports: "/reports",
  settings: "/settings",
  activity: "/activity",
  tools: { volumeCalculator: "/tools/volume-calculator" },
  // Rutas con parámetro: se usan igual, localePath(lang, ROUTES.jobs.detail(id))
  jobs: { detail: (id: string) => `/jobs/${encodeURIComponent(id)}` },
  incidents: { detail: (id: string) => `/incidents/${encodeURIComponent(id)}` },
} as const;

/** Antepone el idioma a una ruta de ROUTES: ("es", "/login") -> "/es/login". */
export function localePath(lang: Locale, route: string): string {
  return route === "/" ? `/${lang}` : `/${lang}${route}`;
}
