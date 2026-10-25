// TODO(supabase): datos de ejemplo. Sustituir por una consulta a la base de datos
// cuando haya proyecto Supabase conectado. Estos valores son ficticios.

import type { Invitation, CompanyDetail, HistoryEvent, User } from "@/features/companies/domain/types";

const BY = "Equipa Mudaro";

const base = {
  taxId: "[NIF]",
  region: "[Região]",
  adminName: "[Nome do administrador]",
  adminEmail: "[email do administrador]",
  phone: "[telefone]",
  emailGeneral: "[email]",
  address: "[morada]",
  origin: "[origem]",
  notes: "[notas]",
  adminMobile: "[telemóvel]",
  imtReference: "[referência]",
  gdprVersion: "v1",
};

const admin = (id: string, invitationPending: boolean, lastAccess: string | null): User => ({
  id: `${id}-admin`,
  name: base.adminName,
  email: base.adminEmail,
  profile: "Administrador",
  invitationPending,
  lastAccess,
});

const operator = (id: string, n: number, invitationPending: boolean, lastAccess: string | null): User => ({
  id: `${id}-operario-${n}`,
  name: `[Operário ${n}]`,
  email: "[email]",
  profile: "Operário",
  invitationPending,
  lastAccess,
});

const invitation = (id: string, sentAt: string, validUntil: string): Invitation => ({
  sentAt,
  validUntil,
  link: `https://app.mudaro.pt/convite/simulado-${id}`,
});

const event = (id: string, n: number, text: string, at: string): HistoryEvent => ({
  id: `${id}-evento-${n}`,
  text,
  by: BY,
  at,
});

export const COMPANIES_MOCK: readonly CompanyDetail[] = [
  {
    ...base,
    id: "empresa-1",
    name: "[Empresa piloto 1]",
    invitationAccepted: false,
    setupSteps: 0,
    deactivatedAt: null,
    gdprContract: false,
    imtUpToDate: true,
    createdAt: "2026-10-20",
    imtVerifiedAt: "2026-10-19",
    gdprSignedAt: null,
    invitation: invitation("empresa-1", "2026-10-20T10:30:00Z", "2026-10-27T10:30:00Z"),
    users: [admin("empresa-1", true, null)],
    history: [
      event("empresa-1", 2, "Convite enviado", "2026-10-20T10:31:00Z"),
      event("empresa-1", 1, "Empresa criada", "2026-10-20T10:30:00Z"),
    ],
  },
  {
    ...base,
    id: "empresa-2",
    name: "[Empresa piloto 2]",
    invitationAccepted: true,
    setupSteps: 2,
    deactivatedAt: null,
    gdprContract: true,
    imtUpToDate: true,
    createdAt: "2026-10-14",
    imtVerifiedAt: "2026-10-13",
    gdprSignedAt: "2026-10-14",
    invitation: invitation("empresa-2", "2026-10-14T09:00:00Z", "2026-10-21T09:00:00Z"),
    users: [admin("empresa-2", false, "2026-10-15T08:20:00Z")],
    history: [
      event("empresa-2", 4, "Administrador entrou pela primeira vez", "2026-10-15T08:20:00Z"),
      event("empresa-2", 3, "Contrato RGPD registado", "2026-10-14T11:00:00Z"),
      event("empresa-2", 2, "Convite enviado", "2026-10-14T09:01:00Z"),
      event("empresa-2", 1, "Empresa criada", "2026-10-14T09:00:00Z"),
    ],
  },
  {
    ...base,
    id: "empresa-3",
    name: "[Empresa piloto 3]",
    invitationAccepted: true,
    setupSteps: 4,
    deactivatedAt: null,
    gdprContract: true,
    imtUpToDate: true,
    createdAt: "2026-10-05",
    imtVerifiedAt: "2026-10-04",
    gdprSignedAt: "2026-10-05",
    invitation: invitation("empresa-3", "2026-10-05T09:00:00Z", "2026-10-12T09:00:00Z"),
    users: [
      admin("empresa-3", false, "2026-10-21T17:45:00Z"),
      operator("empresa-3", 1, false, "2026-10-19T08:10:00Z"),
      operator("empresa-3", 2, true, null),
    ],
    history: [
      event("empresa-3", 4, "Empresa ativada", "2026-10-09T15:00:00Z"),
      event("empresa-3", 3, "Tarifa v1 guardada", "2026-10-09T14:40:00Z"),
      event("empresa-3", 2, "Administrador entrou pela primeira vez", "2026-10-06T08:15:00Z"),
      event("empresa-3", 1, "Empresa criada", "2026-10-05T09:00:00Z"),
    ],
  },
  {
    ...base,
    id: "empresa-4",
    name: "[Empresa piloto 4]",
    invitationAccepted: true,
    setupSteps: 4,
    deactivatedAt: "2026-10-18",
    gdprContract: true,
    imtUpToDate: true,
    createdAt: "2026-09-28",
    imtVerifiedAt: "2026-09-27",
    gdprSignedAt: "2026-09-28",
    invitation: invitation("empresa-4", "2026-09-28T09:00:00Z", "2026-10-05T09:00:00Z"),
    users: [
      admin("empresa-4", false, "2026-10-17T16:00:00Z"),
      operator("empresa-4", 1, false, "2026-10-16T08:30:00Z"),
      operator("empresa-4", 2, true, null),
    ],
    history: [
      event("empresa-4", 3, "Empresa desativada. Motivo: [motivo]", "2026-10-18T12:00:00Z"),
      event("empresa-4", 2, "Empresa ativada", "2026-10-02T15:00:00Z"),
      event("empresa-4", 1, "Empresa criada", "2026-09-28T09:00:00Z"),
    ],
  },
];
