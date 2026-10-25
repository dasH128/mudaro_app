import "server-only";

import { todayIso } from "@/app/lib/format";
import type { CompanyDetail, CompanySummary, HistoryEvent } from "../domain/types";
import { COMPANIES_MOCK } from "./mock";

// TODO(supabase): almacén en memoria que simula la base de datos. Se pierde al reiniciar
// el servidor. Sustituir por consultas a Supabase y por las Edge Functions (`crear-empresa`, etc.).

/** Validez del convite. Valor provisional: confirmar con la configuración de Supabase Auth. */
export const INVITATION_VALIDITY_DAYS = 7;

// Se cuelga de globalThis para sobrevivir a la recarga de módulos en desarrollo.
const globalStore = globalThis as unknown as { __mudaroCompanies?: CompanyDetail[] };

function db(): CompanyDetail[] {
  return (globalStore.__mudaroCompanies ??= COMPANIES_MOCK.map((company) => structuredClone(company)));
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();
}

// TODO(supabase): el link real lo genera Supabase Auth al invitar al administrador.
function newInviteLink(): string {
  return `https://app.mudaro.pt/convite/simulado-${crypto.randomUUID()}`;
}

function newEvent(text: string, by: string): HistoryEvent {
  return { id: crypto.randomUUID(), text, by, at: new Date().toISOString() };
}

function find(id: string): CompanyDetail | undefined {
  return db().find((company) => company.id === id);
}

export async function listCompanies(): Promise<readonly CompanySummary[]> {
  return [...db()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCompany(id: string): Promise<CompanyDetail | undefined> {
  return find(id);
}

export type CreateCompanyInput = {
  name: string;
  taxId: string;
  region: string;
  phone: string;
  emailGeneral: string;
  address: string;
  origin: string;
  notes: string;
  adminName: string;
  adminEmail: string;
  adminMobile: string;
  imtVerified: boolean;
  /** Fecha ISO (aaaa-mm-dd) o null. */
  imtVerifiedAt: string | null;
  imtReference: string;
  gdprSigned: boolean;
  gdprSignedAt: string | null;
  gdprVersion: string;
  sendInvitation: boolean;
  createdBy: string;
};

/** Una empresa nueva nace con convite pendiente: sin invitación aceptada ni pasos de configuración. */
export async function createCompany(input: CreateCompanyInput): Promise<CompanyDetail> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const history: HistoryEvent[] = [newEvent("Empresa criada", input.createdBy)];
  if (input.sendInvitation) history.unshift(newEvent("Convite enviado", input.createdBy));

  const company: CompanyDetail = {
    id,
    name: input.name,
    taxId: input.taxId,
    region: input.region,
    adminName: input.adminName,
    adminEmail: input.adminEmail,
    invitationAccepted: false,
    setupSteps: 0,
    deactivatedAt: null,
    gdprContract: input.gdprSigned,
    imtUpToDate: input.imtVerified,
    createdAt: todayIso(),
    phone: input.phone,
    emailGeneral: input.emailGeneral,
    address: input.address,
    origin: input.origin,
    notes: input.notes,
    adminMobile: input.adminMobile,
    imtVerifiedAt: input.imtVerifiedAt,
    imtReference: input.imtReference,
    gdprSignedAt: input.gdprSignedAt,
    gdprVersion: input.gdprVersion,
    invitation: {
      sentAt: input.sendInvitation ? now : null,
      validUntil: addDays(now, INVITATION_VALIDITY_DAYS),
      link: newInviteLink(),
    },
    users: [
      {
        id: `${id}-admin`,
        name: input.adminName,
        email: input.adminEmail,
        profile: "Administrador",
        invitationPending: true,
        lastAccess: null,
      },
    ],
    history,
  };
  db().push(company);
  return company;
}

/** Reenvía el convite a un utilizador (por defecto, al administrador). */
export async function resendInvite(
  companyId: string,
  userId: string | null,
  by: string,
): Promise<Result<{ email: string }>> {
  const company = find(companyId);
  if (!company) return fail("Empresa não encontrada.");
  if (company.deactivatedAt) return fail("Reative a empresa antes de reenviar convites.");

  const user = userId
    ? company.users.find((u) => u.id === userId)
    : company.users.find((u) => u.profile === "Administrador");
  if (!user) return fail("Utilizador não encontrado.");
  if (!user.invitationPending) return fail("Este utilizador já não tem um convite pendente.");

  // El convite de la empresa es el del administrador.
  if (user.profile === "Administrador") {
    const now = new Date().toISOString();
    company.invitation.sentAt = now;
    company.invitation.validUntil = addDays(now, INVITATION_VALIDITY_DAYS);
  }
  company.history.unshift(newEvent(`Convite reenviado para ${user.email}`, by));
  return { ok: true, value: { email: user.email } };
}

/** Genera un link nuevo para el convite del administrador. */
export async function regenerateInviteLink(companyId: string, by: string): Promise<Result<null>> {
  const company = find(companyId);
  if (!company) return fail("Empresa não encontrada.");
  if (company.invitationAccepted) return fail("O administrador já aceitou o convite.");
  if (company.deactivatedAt) return fail("Reative a empresa antes de gerar um novo link.");

  company.invitation.link = newInviteLink();
  company.invitation.validUntil = addDays(new Date().toISOString(), INVITATION_VALIDITY_DAYS);
  company.history.unshift(newEvent("Novo link do convite gerado", by));
  return { ok: true, value: null };
}

/** Desactiva o reactiva la empresa. El motivo es obligatorio al desactivar (lo valida la acción). */
export async function changeStatus(
  companyId: string,
  deactivate: boolean,
  motivo: string,
  by: string,
): Promise<Result<null>> {
  const company = find(companyId);
  if (!company) return fail("Empresa não encontrada.");

  if (deactivate) {
    if (company.deactivatedAt) return fail("A empresa já está desativada.");
    company.deactivatedAt = todayIso();
    company.history.unshift(newEvent(`Empresa desativada. Motivo: ${motivo}`, by));
  } else {
    if (!company.deactivatedAt) return fail("A empresa já está ativa.");
    company.deactivatedAt = null;
    company.history.unshift(newEvent("Empresa reativada", by));
  }
  return { ok: true, value: null };
}
