import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { readPublicEnv } from "./env";

/**
 * Refresca la sesión de Supabase en cada petición y propaga las cookies nuevas.
 *
 * Solo informa de si hay sesión; no decide permisos. La autorización real se repite
 * en cada página y acción (ver CLAUDE.md, seguridad, punto 3).
 */
export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = readPublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Cabeceras anti-caché que Supabase pide cuando escribe cookies de sesión.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims valida la firma del JWT y refresca la sesión si caducó, sin llamar a Auth en cada petición.
  const { data } = await supabase.auth.getClaims();

  return { response, hasSession: Boolean(data?.claims) };
}
