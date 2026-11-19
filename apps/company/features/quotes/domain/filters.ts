import { PROPOSAL_STATUSES, type Quote, type QuoteStatus } from "./types";

export const SORTS = ["expiry", "newest", "value"] as const;

export type QuoteSort = (typeof SORTS)[number];

export const DEFAULT_SORT: QuoteSort = "expiry";

export function isStatus(value: string | undefined): value is QuoteStatus {
  return PROPOSAL_STATUSES.some((status) => status === value);
}

export function isSort(value: string | undefined): value is QuoteSort {
  return SORTS.some((sort) => sort === value);
}

/** Minúsculas y sin tildes, para que "joao" encuentre "João". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Filtra por estado y por texto (cliente, nº de presupuesto o de pedido). */
export function filterQuotes(
  quotes: readonly Quote[],
  status: QuoteStatus | undefined,
  query: string,
): readonly Quote[] {
  const needle = normalize(query.trim());
  return quotes.filter((quote) => {
    if (status && quote.status !== status) return false;
    if (needle === "") return true;
    return [quote.client, quote.id, quote.orderId].some((field) => normalize(field).includes(needle));
  });
}

/** Presupuestos por estado, para los contadores de las pestañas. */
export function countByStatus(quotes: readonly Quote[]): Record<QuoteStatus, number> {
  const counts: Record<QuoteStatus, number> = {
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    superseded: 0,
  };
  for (const quote of quotes) counts[quote.status] += 1;
  return counts;
}

/**
 * "expiry": primero lo que está abierto (borradores y enviadas, la validez más próxima delante)
 * y después el resto, de más reciente a más antiguo.
 */
export function sortQuotes(quotes: readonly Quote[], sort: QuoteSort): readonly Quote[] {
  const byCreated = (a: Quote, b: Quote) => Date.parse(b.createdAt) - Date.parse(a.createdAt);
  const isOpen = (quote: Quote) => quote.status === "draft" || quote.status === "sent";

  return [...quotes].sort((a, b) => {
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

/** Resumen de las tarjetas: borradores y presupuestos a la espera del cliente. */
export function summarize(quotes: readonly Quote[]) {
  const sent = quotes.filter((quote) => quote.status === "sent");
  return {
    drafts: quotes.filter((quote) => quote.status === "draft").length,
    awaitingCount: sent.length,
    awaitingCents: sent.reduce((sum, quote) => sum + quote.totalCents, 0),
  };
}
