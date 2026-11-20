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
    forgotPassword: "/forgot-password",
    confirm: "/auth/confirm",
    setPassword: "/auth/set-password",
    noAccess: "/no-access",
  },
  orders: {
    list: "/orders",
    new: "/orders/new",
    detail: (id: string) => `/orders/${encodeURIComponent(id)}`,
    created: (id: string) => `/orders/${encodeURIComponent(id)}/created`,
    inventory: (id: string) => `/orders/${encodeURIComponent(id)}/inventory`,
    quote: (id: string) => `/orders/${encodeURIComponent(id)}/quote`,
  },
  // Un orçamento se crea y se ve desde su pedido (orders.quote y la pestaña Orçamentos del detalle)
  quotes: {
    list: "/quotes",
  },
  schedule: "/schedule",
  clients: "/clients",
  fleet: {
    list: "/fleet",
    new: "/fleet/new",
  },
  team: {
    list: "/team",
    new: "/team/new",
  },
  pricing: "/pricing",
  reports: "/reports",
  settings: "/settings",
  activity: "/activity",
  tools: { volumeCalculator: "/tools/volume-calculator" },
  // Rutas con parámetro: se usan igual, localePath(lang, ROUTES.jobs.detail(id))
  jobs: {
    detail: (id: string) => `/jobs/${encodeURIComponent(id)}`,
    // Acta imprimible de recogida o entrega (P13), fuera del menú lateral
    print: (id: string, moment: "pickup" | "delivery") => `/print/jobs/${encodeURIComponent(id)}/${moment}`,
  },
  incidents: { detail: (id: string) => `/incidents/${encodeURIComponent(id)}` },
} as const;

/** Antepone el idioma a una ruta de ROUTES: ("es", "/login") -> "/es/login". */
export function localePath(lang: Locale, route: string): string {
  return route === "/" ? `/${lang}` : `/${lang}${route}`;
}
