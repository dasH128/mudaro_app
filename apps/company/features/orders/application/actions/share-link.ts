"use server";

import { z } from "zod";

import { requireCompanySession } from "@/features/auth/application/require-session";
import { parseOrderNumber } from "@/features/orders/domain/order-number";
import type { ShareLinkResult } from "@/features/orders/domain/types";
import { shareOrderLink } from "@/features/orders/infrastructure/orders.repo";
import { clientLinkUrl } from "../client-link";

const input = z.object({
  lang: z.string(),
  orderId: z.string().refine((id) => parseOrderNumber(id) !== null),
});

/**
 * "Gerar link" y "Gerar link novo" (RF-15). Cada llamada crea un token nuevo y anula el anterior, así que solo se
 * llama al pulsar el botón, nunca al cargar la página. La base vuelve a comprobar que el pedido es de la empresa.
 */
export async function shareLinkAction(raw: unknown): Promise<ShareLinkResult> {
  const lang = typeof raw === "object" && raw !== null && "lang" in raw ? raw.lang : undefined;
  await requireCompanySession(lang);

  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "failed" };

  const shared = await shareOrderLink(parsed.data.orderId);
  if (!shared) return { ok: false, error: "failed" };
  return { ok: true, url: clientLinkUrl(shared.token), validUntil: shared.validUntil };
}
