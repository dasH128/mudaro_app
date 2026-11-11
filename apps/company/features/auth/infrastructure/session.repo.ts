import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

import type { SessionResult } from "../domain/session";

// Lee la sesión de Auth y la fila de company_users. RLS hace el filtrado: si el usuario está inactivo
// o su empresa está desactivada (RF-04, RF-68), `current_company_id()` es null y no llega la empresa.
// cache(): una sola lectura por petición, aunque la llamen el layout, la página y los componentes.
export const getCompanySession = cache(async (): Promise<SessionResult> => {
  // La sesión es un dato de la petición. Sin esto, el JWT se valida (y se lee la hora, `Date.now()`) antes de
  // cualquier acceso dinámico y cacheComponents lo marca como "Blocking Route" al prerenderizar.
  await connection();
  const supabase = await createSupabaseServerClient();

  // getClaims valida la firma del JWT en local (el proyecto firma con ES256), sin llamar a Auth en cada petición.
  // Una sesión revocada sigue valiendo hasta que caduca el token, pero RLS y `active` se comprueban en cada consulta.
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return { status: "anonymous" };

  const { data: row } = await supabase
    .from("company_users")
    .select("id, name, role, active, company_id, companies(trade_name)")
    .eq("id", userId)
    .maybeSingle();

  // El usuario siempre puede leer su propia fila (active, rol), pero su empresa solo si está activa y él también
  // (`current_company_id()`). Por eso, con la cuenta activa, no poder leer la empresa significa que está desactivada.
  if (!row) return { status: "blocked", reason: "none" };
  if (!row.active) return { status: "blocked", reason: "account" };
  if (!row.companies) return { status: "blocked", reason: "company" };

  return {
    status: "ok",
    session: {
      userId: row.id,
      email: typeof auth.claims.email === "string" ? auth.claims.email : "",
      name: row.name,
      role: row.role,
      companyId: row.company_id,
      companyName: row.companies.trade_name,
    },
  };
});
