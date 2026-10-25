import { updateSession } from "@mudaro/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";

import { ROUTES } from "@/app/lib/routes";

const isLoginRoute = (pathname: string) => pathname === ROUTES.login || pathname.startsWith(`${ROUTES.login}/`);

// Refresca la sesión y manda a /login a quien no tiene ninguna. No decide permisos:
// el rol y el MFA se comprueban en cada página y acción (`requirePlatformUser()`) y en RLS.
export async function proxy(request: NextRequest) {
  const { response, hasSession } = await updateSession(request);

  if (!hasSession && !isLoginRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }

  return response;
}

export const config = {
  // Todo menos estáticos e imágenes de Next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
