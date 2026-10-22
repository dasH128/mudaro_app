/**
 * Rutas de las vistas, centralizadas.
 * Para navegar usar siempre ROUTES.x y nunca strings sueltos.
 * (Los tipos genéricos de Next como PageProps<"/empresas"> siguen llevando el literal.)
 */
/** Parámetro de URL con el que P2 avisa al detalle de que la empresa acaba de crearse. */
export const CREATED_PARAM = "criada";

export const ROUTES = {
  home: "/",
  login: "/login",
  empresas: {
    list: "/empresas",
    new: "/empresas/nueva",
    detail: (id: string, options?: { created?: boolean }) =>
      options?.created ? `/empresas/${id}?${CREATED_PARAM}=1` : `/empresas/${id}`,
  },
} as const;
