import "server-only";

import type { Proposal, ProposalsOverview } from "../domain/types";
import { MOCK_METRICS, mockProposals, mockReadyRequests } from "./mock-data";

// Única puerta de entrada a los datos de propuestas: las páginas importan de aquí.
// TODO(supabase): sustituir los datos de ejemplo por consultas (RLS por company_id, RNF-01), conservando la firma.

type Options = {
  /** Solo el administrador ve el margen (RNF-03). Con `false` el margen ni sale de esta capa. */
  includeMargin: boolean;
};

/** Propuestas de la empresa de la sesión, los pedidos listos para orçamentar y los indicadores. */
export async function getProposalsOverview({ includeMargin }: Options): Promise<ProposalsOverview> {
  const now = new Date();
  const hideMargin = (proposal: Proposal): Proposal => ({ ...proposal, marginPercent: null });
  const proposals = mockProposals(now);

  return {
    proposals: includeMargin ? proposals : proposals.map(hideMargin),
    readyRequests: mockReadyRequests(now),
    metrics: MOCK_METRICS,
  };
}
