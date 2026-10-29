import type { Proposal } from "./types";

/** Días antes de la caducidad en los que una propuesta enviada se marca como "a punto de caducar". Provisional. */
export const EXPIRING_SOON_DAYS = 3;

/** Días enteros de `today` a `day` (aaaa-mm-dd). Negativo si `day` ya pasó. */
export function daysBetween(today: string, day: string): number {
  return Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

/** RF-45: una propuesta enviada cuya validez ya pasó figura como caducada, aunque nadie la haya tocado. */
export function applyExpiry(proposals: readonly Proposal[], today: string): readonly Proposal[] {
  return proposals.map((proposal) =>
    proposal.status === "sent" && proposal.validUntil !== null && proposal.validUntil < today
      ? { ...proposal, status: "expired" }
      : proposal,
  );
}

/** Qué decir de la validez de una propuesta. Son códigos: el texto lo pone la interfaz. */
export type Validity =
  | { kind: "not-sent"; createdAt: string }
  | { kind: "expires-today"; validUntil: string }
  | { kind: "expiring"; validUntil: string; days: number }
  | { kind: "valid"; validUntil: string }
  | { kind: "accepted"; at: string }
  | { kind: "rejected"; reason: string | null }
  | { kind: "expired"; on: string }
  | { kind: "superseded" };

/** `proposal` ya debe haber pasado por `applyExpiry`. */
export function deriveValidity(proposal: Proposal, today: string): Validity {
  switch (proposal.status) {
    case "draft":
      return { kind: "not-sent", createdAt: proposal.createdAt };
    case "sent": {
      const validUntil = proposal.validUntil ?? today;
      const days = daysBetween(today, validUntil);
      if (days === 0) return { kind: "expires-today", validUntil };
      if (days <= EXPIRING_SOON_DAYS) return { kind: "expiring", validUntil, days };
      return { kind: "valid", validUntil };
    }
    case "accepted":
      return { kind: "accepted", at: proposal.acceptedAt ?? proposal.createdAt };
    case "rejected":
      return { kind: "rejected", reason: proposal.rejectionReason };
    case "expired":
      return { kind: "expired", on: proposal.validUntil ?? today };
    case "superseded":
      return { kind: "superseded" };
  }
}
