import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

import type { CreateCompanyInput } from "./store";

// Columnas y relaciones que necesita el listado, en una sola consulta (sin N+1).
// Usa la sesión del usuario, no la clave de servicio: RLS limita la lectura al equipo Mudaro.
const SUMMARY_SELECT = `
  id,
  trade_name,
  tax_id,
  base_address,
  phone,
  general_email,
  imt_verified_on,
  gdpr_signed_on,
  deactivated_at,
  created_at,
  company_internal ( region ),
  invitations ( name, email, role, accepted_at, revoked_at, created_at )
` as const;

export async function selectCompanySummaryRows() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("companies")
    .select(SUMMARY_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    // El detalle queda en el log del servidor; hacia fuera solo sale un error genérico.
    console.error("[companies] list failed:", error);
    throw new Error("Failed to list companies");
  }

  return data;
}

/** Fila tal como la devuelve la base de datos. Solo la conoce la capa `data/`. */
export type CompanySummaryRow = Awaited<ReturnType<typeof selectCompanySummaryRows>>[number];

// Todo lo que muestra la ficha. Nunca se pide token_hash: el enlace del convite no sale de la base.
const DETAIL_SELECT = `
  id,
  trade_name,
  tax_id,
  base_address,
  phone,
  general_email,
  imt_verified_on,
  imt_reference,
  gdpr_signed_on,
  gdpr_version,
  deactivated_at,
  created_at,
  company_internal ( region, source, notes ),
  invitations ( id, name, email, phone, role, sent_at, expires_at, accepted_at, revoked_at, created_at ),
  company_users ( id, name, role )
` as const;

/** Una empresa por id, o null si no existe o RLS no la deja ver. */
export async function selectCompanyDetailRow(companyId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("companies")
    .select(DETAIL_SELECT)
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    console.error("[companies] detail failed:", error);
    throw new Error("Failed to load company");
  }

  return data;
}

/** Fila de la ficha tal como la devuelve la base de datos. */
export type CompanyDetailRow = NonNullable<Awaited<ReturnType<typeof selectCompanyDetailRow>>>;

/** Número máximo de eventos del histórico que se cargan (los más recientes). */
const HISTORY_LIMIT = 50;

export async function selectCompanyHistoryRows(companyId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("audit_log")
    .select("id, action, actor_type, data, occurred_at")
    .eq("company_id", companyId)
    .order("occurred_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    console.error("[companies] history failed:", error);
    throw new Error("Failed to load company history");
  }

  return data;
}

/** Evento de `audit_log` tal como lo devuelve la base de datos. */
export type AuditLogRow = Awaited<ReturnType<typeof selectCompanyHistoryRows>>[number];

export type CreateCompanyResult =
  | { ok: true; companyId: string; invitationSent: boolean }
  | { ok: false; code: string };

/** Código de error que devuelve la Edge Function en el cuerpo de la respuesta. */
async function errorCode(error: unknown): Promise<string> {
  const response = (error as { context?: Response }).context;
  const body = (await response?.json().catch(() => null)) as { code?: string } | null;
  return body?.code ?? "unknown";
}

/** Llama a la Edge Function con la sesión del usuario. Nunca usa la clave de servicio. */
export async function invokeCreateCompany(payload: CreateCompanyInput): Promise<CreateCompanyResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.functions.invoke<{ companyId: string; invitationSent: boolean }>(
    "create-company",
    { body: payload },
  );

  if (error) return { ok: false, code: await errorCode(error) };
  if (!data) return { ok: false, code: "unknown" };
  return { ok: true, companyId: data.companyId, invitationSent: data.invitationSent };
}

export type ResendInviteResult = { ok: true; sentAt: string } | { ok: false; code: string };

/** Reenvía el convite del administrador con la sesión del usuario. Nunca usa la clave de servicio. */
export async function invokeResendInvite(companyId: string): Promise<ResendInviteResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.functions.invoke<{ sentAt: string }>("resend-invite", {
    body: { companyId, mode: "email" },
  });

  if (error) return { ok: false, code: await errorCode(error) };
  if (!data) return { ok: false, code: "unknown" };
  return { ok: true, sentAt: data.sentAt };
}

export type GenerateInviteLinkResult = { ok: true; link: string } | { ok: false; code: string };

/** Genera un enlace nuevo para copiarlo, sin enviar email. El enlace no se guarda en ningún sitio. */
export async function invokeGenerateInviteLink(companyId: string): Promise<GenerateInviteLinkResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.functions.invoke<{ link: string }>("resend-invite", {
    body: { companyId, mode: "link" },
  });

  if (error) return { ok: false, code: await errorCode(error) };
  if (!data) return { ok: false, code: "unknown" };
  return { ok: true, link: data.link };
}
