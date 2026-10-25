import "server-only";

import { redirect } from "next/navigation";

import { ROUTES } from "@/app/lib/routes";
import { findPlatformUser, getAuthStep, type AuthStep } from "@/features/auth/data/auth.repo";

export type PlatformUser = {
  id: string;
  name: string;
};

/** Ruta que corresponde a cada punto del flujo de entrada. */
export function routeForAuthStep(step: AuthStep): string {
  switch (step) {
    case "ready":
      return ROUTES.companies.list;
    case "code":
      return ROUTES.loginCode;
    case "enroll":
      return ROUTES.loginMfa;
    case "signed-out":
      return ROUTES.login;
  }
}

/**
 * Comprueba en servidor que hay sesión con MFA verificado y que el usuario es de plataforma.
 * Si falla, redirige al paso de entrada que corresponda. Se vuelve a llamar en cada Server Action:
 * ni el proxy ni el layout bastan, y RLS lo comprueba otra vez en la base de datos.
 */
export async function requirePlatformUser(): Promise<PlatformUser> {
  const step = await getAuthStep();
  if (step !== "ready") redirect(routeForAuthStep(step));

  const platformUser = await findPlatformUser();
  // Sesión válida pero sin fila activa en platform_users: no es del equipo Mudaro.
  if (!platformUser) redirect(ROUTES.login);

  return platformUser;
}
