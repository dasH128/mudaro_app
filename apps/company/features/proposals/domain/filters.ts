import { PROPOSAL_STATUSES, type Proposal, type ProposalStatus } from "./types";

export const SORTS = ["expiry", "newest", "value"] as const;

export type ProposalSort = (typeof SORTS)[number];

export const DEFAULT_SORT: ProposalSort = "expiry";

export function isStatus(value: string | undefined): value is ProposalStatus {
  return PROPOSAL_STATUSES.some((status) => status === value);
}

export function isSort(value: string | undefined): value is ProposalSort {
  return SORTS.some((sort) => sort === value);
}

/** Minúsculas y sin tildes, para que "joao" encuentre "João". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Filtra por estado y por texto (cliente, nº de propuesta o de pedido). */
export function filterProposals(
  proposals: readonly Proposal[],
  status: ProposalStatus | undefined,
  query: string,
): readonly Proposal[] {
  const needle = normalize(query.trim());
  return proposals.filter((proposal) => {
    if (status && proposal.status !== status) return false;
    if (needle === "") return true;
    return [proposal.client, proposal.id, proposal.requestId].some((field) => normalize(field).includes(needle));
  });
}

/** Propuestas por estado, para los contadores de las pestañas. */
export function countByStatus(proposals: readonly Proposal[]): Record<ProposalStatus, number> {
  const counts: Record<ProposalStatus, number> = {
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    superseded: 0,
  };
  for (const proposal of proposals) counts[proposal.status] += 1;
  return counts;
}

/**
 * "expiry": primero lo que está abierto (borradores y enviadas, la validez más próxima delante)
 * y después el resto, de más reciente a más antiguo.
 */
export function sortProposals(proposals: readonly Proposal[], sort: ProposalSort): readonly Proposal[] {
  const byCreated = (a: Proposal, b: Proposal) => Date.parse(b.createdAt) - Date.parse(a.createdAt);
  const isOpen = (proposal: Proposal) => proposal.status === "draft" || proposal.status === "sent";

  return [...proposals].sort((a, b) => {
    if (sort === "newest") return byCreated(a, b);
    if (sort === "value") return b.totalCents - a.totalCents;
    if (isOpen(a) !== isOpen(b)) return isOpen(a) ? -1 : 1;
    if (isOpen(a)) {
      if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
      if (a.validUntil && b.validUntil && a.validUntil !== b.validUntil) return a.validUntil < b.validUntil ? -1 : 1;
    }
    return byCreated(a, b);
  });
}

/** Resumen de las tarjetas: borradores y propuestas a la espera del cliente. */
export function summarize(proposals: readonly Proposal[]) {
  const sent = proposals.filter((proposal) => proposal.status === "sent");
  return {
    drafts: proposals.filter((proposal) => proposal.status === "draft").length,
    awaitingCount: sent.length,
    awaitingCents: sent.reduce((sum, proposal) => sum + proposal.totalCents, 0),
  };
}
