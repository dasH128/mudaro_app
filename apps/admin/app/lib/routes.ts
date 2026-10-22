/**
 * Rutas de las vistas, centralizadas.
 * Para navegar usar siempre ROUTES.x y nunca strings sueltos.
 * (Los tipos genéricos de Next como PageProps<"/empresas"> siguen llevando el literal.)
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  empresas: {
    list: "/empresas",
    new: "/empresas/nueva",
    detail: (id: string) => `/empresas/${id}`,
  },
} as const;
