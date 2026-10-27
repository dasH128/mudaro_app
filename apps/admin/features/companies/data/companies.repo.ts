import "server-only";

import type { CompanyDetail, CompanySummary } from "../domain/types";
import { toCompanyDetail, toCompanySummary } from "./companies.mapper";
import {
  invokeCreateCompany,
  invokeGenerateInviteLink,
  invokeResendInvite,
  selectCompanyDetailRow,
  selectCompanyHistoryRows,
  selectCompanySummaryRows,
  type CreateCompanyResult,
  type GenerateInviteLinkResult,
  type ResendInviteResult,
} from "./companies.queries";
import type { CreateCompanyInput } from "./store";

// Única puerta de entrada a los datos de empresas: páginas y acciones importan de aquí.
// TODO(supabase): el listado, el detalle, el alta y el reenvío ya usan Supabase. Los cambios de estado
// siguen en el almacén en memoria (`store.ts`) y se irán sustituyendo conservando estas firmas.
export { changeStatus, type CreateCompanyInput } from "./store";

/** Alta de empresa: la Edge Function `create-company` valida el rol, crea la empresa y envía el convite. */
export async function createCompany(input: CreateCompanyInput): Promise<CreateCompanyResult> {
  return invokeCreateCompany(input);
}

/** Reenvía el convite del administrador: la Edge Function `resend-invite` genera el enlace y lo envía. */
export async function resendInvite(companyId: string): Promise<ResendInviteResult> {
  return invokeResendInvite(companyId);
}

/** Enlace nuevo del convite para copiarlo. Solo existe en la respuesta, no se guarda. */
export async function generateInviteLink(companyId: string): Promise<GenerateInviteLinkResult> {
  return invokeGenerateInviteLink(companyId);
}

/** Empresas del piloto, de la más reciente a la más antigua. */
export async function listCompanies(): Promise<readonly CompanySummary[]> {
  const rows = await selectCompanySummaryRows();
  return rows.map(toCompanySummary);
}

/** Ficha de una empresa, o undefined si no existe o no es visible para el equipo Mudaro. */
export async function getCompany(id: string): Promise<CompanyDetail | undefined> {
  const [row, history] = await Promise.all([selectCompanyDetailRow(id), selectCompanyHistoryRows(id)]);
  if (!row) return undefined;
  return toCompanyDetail(row, history);
}
