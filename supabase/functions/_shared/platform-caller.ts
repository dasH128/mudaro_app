import { createClient } from "npm:@supabase/supabase-js@2.118.0";

/**
 * Comprueba que quien llama es del equipo Mudaro: JWT válido, MFA verificado (aal2)
 * y fila activa en platform_users. Usa el JWT del llamante, así que la comprobación
 * la hace la propia base de datos (is_platform_user), no esta función.
 * Devuelve el id del usuario o null si no cumple.
 */
export async function requirePlatformCaller(request: Request): Promise<{ id: string } | null> {
  const authorization = request.headers.get("Authorization");
  if (!authorization) return null;

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const { data: isPlatform, error: rpcError } = await supabase.rpc("is_platform_user");
  if (rpcError || isPlatform !== true) return null;

  return { id: userData.user.id };
}

/** Cliente con clave de servicio. Solo existe en Edge Functions, nunca en Next.js. */
export function createServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
