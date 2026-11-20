import type { Quote } from "./types";

/** Días antes de la caducidad en los que un presupuesto enviado se marca como "a punto de caducar". Provisional. */
export const EXPIRING_SOON_DAYS = 3;

/** Días enteros de `today` a `day` (aaaa-mm-dd). Negativo si `day` ya pasó. */
export function daysBetween(today: string, day: string): number {
  return Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

/** RF-45: un presupuesto enviado cuya validez ya pasó figura como caducado, aunque nadie lo haya tocado. */
export function applyExpiry(quotes: readonly Quote[], today: string): readonly Quote[] {
  return quotes.map((quote) =>
    quote.status === "sent" && quote.validUntil !== null && quote.validUntil < today
      ? { ...quote, status: "expired" }
      : quote,
  );
}

/** Qué decir de la validez de un presupuesto. Son códigos: el texto lo pone la interfaz. */
export type Validity =
  | { kind: "not-sent"; createdAt: string }
  | { kind: "expires-today"; validUntil: string }
  | { kind: "expiring"; validUntil: string; days: number }
  | { kind: "valid"; validUntil: string }
  | { kind: "accepted"; at: string }
  | { kind: "rejected"; reason: string | null }
  | { kind: "expired"; on: string }
  | { kind: "superseded" };

/** `quote` ya debe haber pasado por `applyExpiry`. */
export function deriveValidity(quote: Quote, today: string): Validity {
  switch (quote.status) {
    case "draft":
      return { kind: "not-sent", createdAt: quote.createdAt };
    case "sent": {
      const validUntil = quote.validUntil ?? today;
      const days = daysBetween(today, validUntil);
      if (days === 0) return { kind: "expires-today", validUntil };
      if (days <= EXPIRING_SOON_DAYS) return { kind: "expiring", validUntil, days };
      return { kind: "valid", validUntil };
    }
    case "accepted":
      return { kind: "accepted", at: quote.acceptedAt ?? quote.createdAt };
    case "rejected":
      return { kind: "rejected", reason: quote.rejectionReason };
    case "expired":
      return { kind: "expired", on: quote.validUntil ?? today };
    case "superseded":
      return { kind: "superseded" };
  }
}
