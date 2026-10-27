// TODO(supabase): datos de ejemplo. Sustituir por una consulta a la base de datos
// cuando haya proyecto Supabase conectado. Estos valores son ficticios.

import type { CompanyDetail, HistoryAction, HistoryEvent, Invitation, User } from "@/features/companies/domain/types";

const BY = "Equipa Mudaro";

const base = {
  taxId: "[Tax ID]",
  region: "[Region]",
  adminName: "[Administrator name]",
  adminEmail: "[administrator email]",
  phone: "[phone]",
  emailGeneral: "[email]",
  address: "[address]",
  origin: "[origin]",
  notes: "[notes]",
  adminMobile: "[mobile]",
  imtReference: "[reference]",
  gdprVersion: "v1",
};

const admin = (id: string, invitationPending: boolean, lastAccess: string | null): User => ({
  id: `${id}-admin`,
  name: base.adminName,
  email: base.adminEmail,
  profile: "administrator",
  invitationPending,
  lastAccess,
});

const operator = (id: string, n: number, invitationPending: boolean, lastAccess: string | null): User => ({
  id: `${id}-operator-${n}`,
  name: `[Operator ${n}]`,
  email: "[email]",
  profile: "operator",
  invitationPending,
  lastAccess,
});

const invitation = (id: string, sentAt: string, validUntil: string): Invitation => ({
  sentAt,
  validUntil,
  link: `https://app.mudaro.pt/invitation/simulated-${id}`,
});

const event = (id: string, n: number, action: HistoryAction, at: string, detail: string | null = null): HistoryEvent => ({
  id: `${id}-event-${n}`,
  action,
  detail,
  by: BY,
  at,
});

export const COMPANIES_MOCK: readonly CompanyDetail[] = [
  {
    ...base,
    id: "company-1",
    name: "[Pilot company 1]",
    invitationAccepted: false,
    setupSteps: 0,
    deactivatedAt: null,
    gdprContract: false,
    imtUpToDate: true,
    createdAt: "2026-10-20",
    imtVerifiedAt: "2026-10-19",
    gdprSignedAt: null,
    invitation: invitation("company-1", "2026-10-20T10:30:00Z", "2026-10-27T10:30:00Z"),
    users: [admin("company-1", true, null)],
    history: [
      event("company-1", 2, "invitation_sent", "2026-10-20T10:31:00Z"),
      event("company-1", 1, "company_created", "2026-10-20T10:30:00Z"),
    ],
  },
  {
    ...base,
    id: "company-2",
    name: "[Pilot company 2]",
    invitationAccepted: true,
    setupSteps: 2,
    deactivatedAt: null,
    gdprContract: true,
    imtUpToDate: true,
    createdAt: "2026-10-14",
    imtVerifiedAt: "2026-10-13",
    gdprSignedAt: "2026-10-14",
    invitation: invitation("company-2", "2026-10-14T09:00:00Z", "2026-10-21T09:00:00Z"),
    users: [admin("company-2", false, "2026-10-15T08:20:00Z")],
    history: [
      event("company-2", 4, "admin_first_login", "2026-10-15T08:20:00Z"),
      event("company-2", 3, "gdpr_contract_registered", "2026-10-14T11:00:00Z"),
      event("company-2", 2, "invitation_sent", "2026-10-14T09:01:00Z"),
      event("company-2", 1, "company_created", "2026-10-14T09:00:00Z"),
    ],
  },
  {
    ...base,
    id: "company-3",
    name: "[Pilot company 3]",
    invitationAccepted: true,
    setupSteps: 4,
    deactivatedAt: null,
    gdprContract: true,
    imtUpToDate: true,
    createdAt: "2026-10-05",
    imtVerifiedAt: "2026-10-04",
    gdprSignedAt: "2026-10-05",
    invitation: invitation("company-3", "2026-10-05T09:00:00Z", "2026-10-12T09:00:00Z"),
    users: [
      admin("company-3", false, "2026-10-21T17:45:00Z"),
      operator("company-3", 1, false, "2026-10-19T08:10:00Z"),
      operator("company-3", 2, true, null),
    ],
    history: [
      event("company-3", 4, "company_activated", "2026-10-09T15:00:00Z"),
      event("company-3", 3, "tariff_saved", "2026-10-09T14:40:00Z", "v1"),
      event("company-3", 2, "admin_first_login", "2026-10-06T08:15:00Z"),
      event("company-3", 1, "company_created", "2026-10-05T09:00:00Z"),
    ],
  },
  {
    ...base,
    id: "company-4",
    name: "[Pilot company 4]",
    invitationAccepted: true,
    setupSteps: 4,
    deactivatedAt: "2026-10-18",
    gdprContract: true,
    imtUpToDate: true,
    createdAt: "2026-09-28",
    imtVerifiedAt: "2026-09-27",
    gdprSignedAt: "2026-09-28",
    invitation: invitation("company-4", "2026-09-28T09:00:00Z", "2026-10-05T09:00:00Z"),
    users: [
      admin("company-4", false, "2026-10-17T16:00:00Z"),
      operator("company-4", 1, false, "2026-10-16T08:30:00Z"),
      operator("company-4", 2, true, null),
    ],
    history: [
      event("company-4", 3, "company_deactivated", "2026-10-18T12:00:00Z", "[reason]"),
      event("company-4", 2, "company_activated", "2026-10-02T15:00:00Z"),
      event("company-4", 1, "company_created", "2026-09-28T09:00:00Z"),
    ],
  },
];
