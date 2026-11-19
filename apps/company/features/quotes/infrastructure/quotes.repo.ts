import "server-only";

import type { Quote, QuotesOverview } from "../domain/types";
import { MOCK_METRICS, mockQuotes, mockReadyOrders } from "./mock-data";

// Única puerta de entrada a los datos de presupuestos: las páginas importan de aquí.
// TODO(supabase): sustituir los datos de ejemplo por consultas (RLS por company_id, RNF-01), conservando la firma.

type Options = {
  /** Solo el administrador ve el margen (RNF-03). Con `false` el margen ni sale de esta capa. */
  includeMargin: boolean;
};

/** Presupuestos de la empresa de la sesión, los pedidos listos para orçamentar y los indicadores. */
export async function getQuotesOverview({ includeMargin }: Options): Promise<QuotesOverview> {
  const now = new Date();
  const hideMargin = (quote: Quote): Quote => ({ ...quote, marginPercent: null });
  const quotes = mockQuotes(now);

  return {
    quotes: includeMargin ? quotes : quotes.map(hideMargin),
    readyOrders: mockReadyOrders(now),
    metrics: MOCK_METRICS,
  };
}
