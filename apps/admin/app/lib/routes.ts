/**
 * Rutas de las vistas, centralizadas.
 * Para navegar usar siempre ROUTES.x y nunca strings sueltos.
 * (Los tipos genéricos de Next como PageProps<"/companies"> siguen llevando el literal.)
 */
/** Parámetro de URL con el que P2 avisa al detalle de que la empresa acaba de crearse. */
export const CREATED_PARAM = "created";

export const ROUTES = {
  home: "/",
  login: "/login",
  /** Segundo paso del login: código de la app de autenticación. */
  loginCode: "/login/code",
  /** Primer acceso: activar la app de autenticación (MFA). */
  loginMfa: "/login/mfa",
  companies: {
    list: "/companies",
    new: "/companies/new",
    detail: (id: string, options?: { created?: boolean }) =>
      options?.created ? `/companies/${id}?${CREATED_PARAM}=1` : `/companies/${id}`,
  },
} as const;
