import { deriveStatus, type CompanyStatus } from "./status";
import type { CompanySummary } from "./types";

export type CompanyRow = CompanySummary & { status: CompanyStatus };

export function withStatus(companies: readonly CompanySummary[]): CompanyRow[] {
  return companies.map((e) => ({ ...e, status: deriveStatus(e) }));
}

/** Minúsculas y sin acentos, para que "configuracao" encuentre "configuração". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function filterCompanies(rows: CompanyRow[], status: CompanyStatus | undefined, q: string): CompanyRow[] {
  const needle = normalize(q.trim());
  return rows.filter((row) => {
    if (status && row.status !== status) return false;
    if (!needle) return true;
    return [row.name, row.taxId, row.adminName, row.adminEmail].some((field) => normalize(field).includes(needle));
  });
}

export function countByStatus(rows: CompanyRow[]): Record<CompanyStatus, number> {
  const counts: Record<CompanyStatus, number> = { invitation: 0, setup: 0, active: 0, deactivated: 0 };
  for (const row of rows) counts[row.status] += 1;
  return counts;
}
