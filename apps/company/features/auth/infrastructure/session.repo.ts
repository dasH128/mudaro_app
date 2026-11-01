import "server-only";

import { cache } from "react";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

import type { SessionResult } from "../domain/session";

// Lee la sesión de Auth y la fila de company_users. RLS hace el filtrado: si el usuario está inactivo
// o su empresa está desactivada (RF-04, RF-68), `current_company_id()` es null y no llega la empresa.
// cache(): una sola lectura por petición, aunque la llamen el layout, la página y los componentes.
export const getCompanySession = cache(async (): Promise<SessionResult> => {
  const supabase = await createSupabaseServerClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: "anonymous" };

  const { data: row } = await supabase
    .from("company_users")
    .select("id, name, role, active, company_id, companies(trade_name)")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!row || !row.active || !row.companies) return { status: "no-company" };

  return {
    status: "ok",
    session: {
      userId: row.id,
      email: auth.user.email ?? "",
      name: row.name,
      role: row.role,
      companyId: row.company_id,
      companyName: row.companies.trade_name,
    },
  };
});
