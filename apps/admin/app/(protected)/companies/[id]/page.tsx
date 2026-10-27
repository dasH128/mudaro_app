import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/app/components/back-link";
import { PageTitle } from "@/app/components/page-title";
import { Button } from "@/app/components/ui/button";
import { CREATED_PARAM, ROUTES } from "@/app/lib/routes";
import { deriveStatus } from "@/features/companies/domain/status";
import { getCompany } from "@/features/companies/data/companies.repo";
import { StatusBadge } from "@/features/companies/components/status-badge";
import { SettingsCard } from "@/features/companies/components/settings-card";
import { InvitationCard } from "@/features/companies/components/invitation-card";
import { DataCard } from "@/features/companies/components/data-card";
import { DocumentsCard } from "@/features/companies/components/documents-card";
import { StatusDialog } from "@/features/companies/components/status-dialog";
import { HistoryCard } from "@/features/companies/components/history-card";
import { UsersCard } from "@/features/companies/components/users-card";

export const metadata: Metadata = {
  title: "Painel Mudaro · Detalhe da empresa",
};

export default async function CompanyDetailPage({ params, searchParams }: PageProps<"/companies/[id]">) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const query = await searchParams;
  const justCreated = query[CREATED_PARAM] === "1";

  const status = deriveStatus(company);
  const deactivated = status === "deactivated";
  const invitation = company.invitation;
  const invitationSent = Boolean(invitation?.sentAt);
  const showInvitation = invitation !== null && !company.invitationAccepted && !deactivated;

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-7">
      {justCreated && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-[14px] bg-foreground px-[18px] py-3.5 text-[15px] text-background"
        >
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12l5 5L20 7" />
            </svg>
          </span>
          {invitationSent ? (
            <span>
              Empresa criada. Enviámos o convite para <strong>{company.adminEmail}</strong>.
            </span>
          ) : (
            <span>Empresa criada. O convite ainda não foi enviado. Pode reenviá-lo abaixo.</span>
          )}
        </div>
      )}

      {deactivated && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-[14px] border border-status-off-border bg-line-soft px-[18px] py-3.5 text-[15px]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 018 0v4" />
          </svg>
          <span>Empresa desativada. Os utilizadores desta empresa não conseguem entrar na app até a reativar.</span>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <BackLink href={ROUTES.companies.list}>Empresas</BackLink>
          <PageTitle>{company.name}</PageTitle>
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={status} />
            <span className="text-sm text-muted">
              NIF {company.taxId}
              {company.region && ` · ${company.region}`}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Sin diseño de flujo todavía: se muestra inerte. */}
          <Button variant="secondary" disabled title="Em breve" aria-label="Editar dados (em breve)">
            Editar dados
          </Button>
          <StatusDialog companyId={company.id} deactivate={!deactivated} />
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          {showInvitation && <InvitationCard companyId={company.id} invitation={invitation} />}
          <UsersCard
            companyId={company.id}
            users={company.users}
            companyDeactivated={deactivated}
          />
          <SettingsCard setupSteps={company.setupSteps} />
        </div>
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
          <DocumentsCard company={company} />
          <DataCard company={company} />
          <HistoryCard history={company.history} />
        </div>
      </div>
    </div>
  );
}
