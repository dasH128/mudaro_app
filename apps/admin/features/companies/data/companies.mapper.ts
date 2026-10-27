import { toLisbonDate } from "@/app/lib/format";

import { countSetupSteps, isProfileComplete } from "../domain/setup-steps";
import type { CompanyDetail, CompanySummary, HistoryAction, HistoryEvent, User } from "../domain/types";
import type { AuditLogRow, CompanyDetailRow, CompanySummaryRow } from "./companies.queries";

type InvitationRow = CompanySummaryRow["invitations"][number];

/** La invitación vigente del administrador: la más reciente que no se ha revocado. */
function pickAdminInvitation<T extends InvitationRow>(invitations: T[]): T | undefined {
  return invitations
    .filter((invitation) => invitation.role === "administrator" && invitation.revoked_at === null)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
}

/** Convierte una fila de la base de datos (inglés, snake_case) en la entidad de dominio. */
export function toCompanySummary(row: CompanySummaryRow): CompanySummary {
  const adminInvitation = pickAdminInvitation(row.invitations);
  const invitationAccepted = Boolean(adminInvitation?.accepted_at);

  const setupSteps = countSetupSteps({
    invitationAccepted,
    profileComplete: isProfileComplete({
      address: row.base_address,
      phone: row.phone,
      generalEmail: row.general_email,
    }),
    // TODO(supabase): todavía no existen las tablas de vehículos y tarifas (paso 2 del plan de BD,
    // docs/plan-modelo-bd.md). Hasta entonces ninguna empresa real puede llegar a "active".
    hasVehicles: false,
    hasTariff: false,
  });

  return {
    id: row.id,
    name: row.trade_name,
    taxId: row.tax_id,
    region: row.company_internal?.region ?? "",
    adminName: adminInvitation?.name ?? "",
    adminEmail: adminInvitation?.email ?? "",
    invitationAccepted,
    setupSteps,
    deactivatedAt: row.deactivated_at,
    gdprContract: row.gdpr_signed_on !== null,
    imtUpToDate: row.imt_verified_on !== null,
    createdAt: toLisbonDate(row.created_at),
  };
}

/** Quién aparece en la lista de utilizadores: los que ya tienen cuenta o un convite pendiente. */
function toUser(row: CompanyDetailRow["company_users"][number]): User {
  return {
    id: row.id,
    name: row.name,
    // TODO(supabase): el email vive en Auth y el cliente no puede leerlo. Pendiente de decidir (vista o Edge Function).
    email: "",
    profile: row.role,
    invitationPending: false,
    // TODO(supabase): no hay último acceso en el esquema todavía (Auth o registro propio).
    lastAccess: null,
  };
}

function toPendingUser(row: InvitationRow & { id: string }): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    profile: row.role,
    invitationPending: true,
    lastAccess: null,
  };
}

const HISTORY_ACTIONS: readonly HistoryAction[] = [
  "company_created",
  "company_activated",
  "company_deactivated",
  "company_reactivated",
  "invitation_sent",
  "invitation_resent",
  "invitation_link_regenerated",
  "admin_first_login",
  "gdpr_contract_registered",
  "tariff_saved",
];

function isHistoryAction(value: string): value is HistoryAction {
  return HISTORY_ACTIONS.some((action) => action === value);
}

/** Quién hizo la acción. Los nombres individuales de Mudaro no son legibles con RLS, así que se muestra el tipo. */
const ACTOR_LABEL: Record<AuditLogRow["actor_type"], string> = {
  platform: "Equipa Mudaro",
  company: "Empresa",
  system: "Sistema",
};

/** Por convención, `data.detail` guarda el dato que completa la acción (motivo, email, versión). */
function detailOf(data: AuditLogRow["data"]): string | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  const value = data["detail"];
  return typeof value === "string" ? value : null;
}

function toHistoryEvent(row: AuditLogRow): HistoryEvent | null {
  // Acciones que aún no están en el dominio (p. ej. de otra app) se omiten en vez de mostrar un código crudo.
  if (!isHistoryAction(row.action)) return null;
  return {
    id: String(row.id),
    action: row.action,
    detail: detailOf(row.data),
    by: ACTOR_LABEL[row.actor_type],
    at: row.occurred_at,
  };
}

/** Convierte la fila de la ficha y su histórico en la entidad de dominio del detalle. */
export function toCompanyDetail(row: CompanyDetailRow, history: readonly AuditLogRow[]): CompanyDetail {
  const adminInvitation = pickAdminInvitation(row.invitations);
  const pendingInvitations = row.invitations.filter(
    (invitation) => invitation.accepted_at === null && invitation.revoked_at === null,
  );

  return {
    ...toCompanySummary(row),
    phone: row.phone ?? "",
    emailGeneral: row.general_email ?? "",
    address: row.base_address ?? "",
    origin: row.company_internal?.source ?? "",
    notes: row.company_internal?.notes ?? "",
    adminMobile: adminInvitation?.phone ?? "",
    imtVerifiedAt: row.imt_verified_on,
    imtReference: row.imt_reference ?? "",
    gdprSignedAt: row.gdpr_signed_on,
    gdprVersion: row.gdpr_version ?? "",
    // TODO(supabase): revisar los días y actualizar. Auth marca la caducidad real del enlace; el 7 de
    // invitations.expires_at es provisional y puede no coincidir con la configuración del proyecto.
    // Plan A: el enlace no se guarda en claro (solo su hash), así que la ficha nunca lo trae.
    invitation: adminInvitation
      ? { sentAt: adminInvitation.sent_at, validUntil: adminInvitation.expires_at, link: null }
      : null,
    users: [...row.company_users.map(toUser), ...pendingInvitations.map(toPendingUser)],
    history: history.map(toHistoryEvent).filter((event): event is HistoryEvent => event !== null),
  };
}
