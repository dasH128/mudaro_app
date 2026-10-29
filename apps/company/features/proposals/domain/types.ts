// Entidades de la lista de propuestas (M7). TypeScript puro: sin React, Next ni Supabase.
// Los importes van en céntimos y las fechas en ISO; el formato (RNF-10) lo pone la interfaz.

export const PROPOSAL_STATUSES = ["draft", "sent", "accepted", "rejected", "expired", "superseded"] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export type Proposal = {
  /** Número de propuesta (PR-0415). Todas sus versiones comparten número (RF-42). */
  id: string;
  version: number;
  /** Pedido del que sale (MD-0831). */
  requestId: string;
  client: string;
  from: string;
  to: string;
  volumeM3: number;
  /** Total con IVA, en céntimos. */
  totalCents: number;
  /** Margen en %. `null` si quien consulta no es administrador (RNF-03). */
  marginPercent: number | null;
  /** Estado guardado. El que se muestra sale de `applyExpiry` (RF-45). */
  status: ProposalStatus;
  /** Instante de creación, ISO. */
  createdAt: string;
  /** Último día de validez, aaaa-mm-dd. `null` mientras es borrador. */
  validUntil: string | null;
  acceptedAt: string | null;
  rejectionReason: string | null;
};

/** Pedido con inventario recibido que aún no tiene propuesta. */
export type ReadyRequest = {
  id: string;
  client: string;
  from: string;
  to: string;
  volumeM3: number;
  /** Instante en que llegó el inventario, ISO. */
  receivedAt: string;
  /** Objetos libres sin medidas (RF-36). */
  missingMeasures: number;
};

/** Indicadores que no salen de la lista visible. */
export type ProposalMetrics = {
  /** Propuestas aceptadas / enviadas en los últimos 30 días, de 0 a 1. */
  acceptanceRate: number;
  /** Días medios desde la creación del pedido hasta enviar la propuesta. */
  averageDaysToProposal: number;
};

export type ProposalsOverview = {
  proposals: readonly Proposal[];
  readyRequests: readonly ReadyRequest[];
  metrics: ProposalMetrics;
};
