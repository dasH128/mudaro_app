import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

import {
  INACTIVE_REASONS,
  POSITIONS,
  type Admin,
  type CrewData,
  type InactiveReason,
  type Member,
  type MemberChange,
  type Position,
  type TeamEvent,
  type TeamOverview,
} from "../domain/types";

// Única puerta de entrada a los datos del equipo: las páginas importan de aquí.
// Las personas del equipo son `crew_members` (paso 6.0b): sin cuenta en el MVP, las gestiona el administrador.
// RLS por company_id y solo administradores (RNF-01).

type Options = {
  /** Usuario de la sesión, para marcar "Tu" entre los administradores. */
  userId: string;
};

type AuditData = {
  by?: string;
  withoutPhone?: boolean;
  from?: unknown;
  to?: unknown;
  reason?: unknown;
};

const CREW_COLUMNS =
  "id, name, phone, position, active, inactive_reason, inactive_since, inactive_user:company_users!crew_members_inactive_by_fkey(name)";

/** aaaa-mm-dd de Lisboa a partir de un instante. */
function lisbonDay(instant: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon" }).format(new Date(instant));
}

const isPosition = (value: unknown): value is Position => POSITIONS.some((p) => p === value);
const isReason = (value: unknown): value is InactiveReason => INACTIVE_REASONS.some((r) => r === value);
const textOrNull = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);

/** Convierte un evento de audit_log en un cambio del histórico. Las acciones desconocidas se ignoran. */
function changeOf(action: string, data: AuditData): MemberChange | null {
  switch (action) {
    case "crew_member_created":
      return { kind: "added", withoutPhone: data.withoutPhone === true };
    case "crew_member_renamed":
      return { kind: "renamed", from: String(data.from ?? ""), to: String(data.to ?? "") };
    case "crew_member_phone_changed":
      return { kind: "phone-changed", from: textOrNull(data.from), to: textOrNull(data.to) };
    case "crew_member_position_changed":
      return isPosition(data.from) && isPosition(data.to) ? { kind: "position-changed", from: data.from, to: data.to } : null;
    case "crew_member_deactivated":
      return isReason(data.reason) ? { kind: "deactivated", reason: data.reason } : null;
    case "crew_member_reactivated":
      return { kind: "reactivated" };
    default:
      return null;
  }
}

/** Personas y administradores de la empresa de la sesión. */
export async function getTeamOverview({ userId }: Options): Promise<TeamOverview> {
  const supabase = await createSupabaseServerClient();

  const [crewResult, adminsResult, auditResult] = await Promise.all([
    supabase.from("crew_members").select(CREW_COLUMNS).order("created_at", { ascending: true }),
    supabase.from("company_users").select("id, name").eq("role", "administrator").eq("active", true).order("created_at"),
    supabase
      .from("audit_log")
      .select("id, entity_id, action, occurred_at, data")
      .eq("entity", "crew_member")
      .order("occurred_at", { ascending: false }),
  ]);

  if (crewResult.error) throw new Error(`team: no se pudieron leer las personas (${crewResult.error.code})`);
  if (adminsResult.error) throw new Error(`team: no se pudieron leer los administradores (${adminsResult.error.code})`);

  // Histórico por persona, del más reciente al más antiguo
  const history = new Map<string, TeamEvent[]>();
  for (const row of auditResult.data ?? []) {
    const data = (row.data ?? {}) as AuditData;
    const change = changeOf(row.action, data);
    if (!change) continue;
    const event = { ...change, id: String(row.id), at: lisbonDay(row.occurred_at), by: data.by ?? "" } as TeamEvent;
    history.set(row.entity_id, [...(history.get(row.entity_id) ?? []), event]);
  }

  const people: Member[] = crewResult.data.map((row) => ({
    kind: "member",
    id: row.id,
    name: row.name,
    position: row.position,
    phone: row.phone,
    // Sin cuenta en la app (MVP): ni email ni accesos
    email: null,
    lastAccess: null,
    active: row.active,
    inactive:
      !row.active && row.inactive_reason && row.inactive_since
        ? { reason: row.inactive_reason, since: row.inactive_since, by: row.inactive_user?.name ?? "" }
        : undefined,
    // TODO(paso 6.1): estado en directo, trabajos, semana y números de 30 días salen de las asignaciones.
    live: { kind: "free" },
    lastWorkOn: null,
    jobs: [],
    weekHours: [0, 0, 0, 0, 0, 0, 0],
    stats30d: { jobs: 0, hours: 0, incidents: 0 },
    history: history.get(row.id) ?? [],
  }));

  const admins: Admin[] = adminsResult.data.map((row) => ({
    id: row.id,
    name: row.name,
    email: null,
    you: row.id === userId,
    lastAccess: null,
  }));

  // TODO(paso 6.2): faltan personas en una mudança según las asignaciones.
  return { people, admins, metrics: { understaffed: null } };
}

export type CreateCrewResult = { ok: true; id: string } | { ok: false; error: "failed" };
export type EditCrewResult = { ok: true } | { ok: false; error: "notFound" | "failed" };

function editResult(error: { code?: string } | null): EditCrewResult {
  if (!error) return { ok: true };
  if (error.code === "P0002") return { ok: false, error: "notFound" };
  // 23514: un valor fuera de las restricciones de la tabla. zod ya los comprueba, así que llegar aquí es un fallo.
  console.error(`team: no se pudo editar la persona (${error.code ?? "sin código"})`);
  return { ok: false, error: "failed" };
}

/** Da de alta una persona con `create_crew_member` (valida sesión y rol en la base de datos). */
export async function createCrewMember(data: CrewData): Promise<CreateCrewResult> {
  const supabase = await createSupabaseServerClient();
  const { data: id, error } = await supabase.rpc("create_crew_member", {
    p_name: data.name,
    p_phone: data.phone ?? "",
    p_position: data.position,
  });
  if (error || !id) {
    console.error(`team: no se pudo crear la persona (${error?.code ?? "sin id"})`);
    return { ok: false, error: "failed" };
  }
  return { ok: true, id };
}

/** Guarda nombre, teléfono y función con `update_crew_member`. */
export async function updateCrewMember(id: string, data: CrewData): Promise<EditCrewResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_crew_member", {
    p_id: id,
    p_name: data.name,
    p_phone: data.phone ?? "",
    p_position: data.position,
  });
  return editResult(error);
}

/** Activa o desactiva la persona con `set_crew_member_active`. Desactivar exige motivo. */
export async function setCrewMemberActive(id: string, active: boolean, reason: InactiveReason | null): Promise<EditCrewResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_crew_member_active", {
    p_id: id,
    p_active: active,
    // Al activar no hay motivo; el generador de tipos marca el argumento como no nulo.
    p_reason: reason as InactiveReason,
  });
  return editResult(error);
}
