"use server";

import { headers } from "next/headers";

import { acceptSchema, rejectSchema } from "@/features/order/application/schemas/quote";
import type { ClientResult } from "@/features/order/domain/types";
import { acceptClientQuote, rejectClientQuote } from "@/features/order/infrastructure/client-order.repo";

// El cliente no tiene sesión: la autorización es el token del enlace (Edge Function `client-order`).

export type AcceptResult = ClientResult | { ok: false; error: "nameRequired" | "signatureRequired" | "signatureTooLarge" };

/** IP del navegador del cliente, para la prueba de la aceptación (RF-43). La primera de x-forwarded-for. */
async function clientIp(): Promise<string | null> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip")?.trim() || "";
  // Solo una IP con forma de IP: la Edge Function la vuelve a validar
  return /^[0-9a-fA-F:.]{3,45}$/.test(forwarded) ? forwarded : null;
}

/** Aceptar el orçamento con nombre, firma y los opcionales elegidos. */
export async function acceptQuoteAction(input: unknown): Promise<AcceptResult> {
  const parsed = acceptSchema.safeParse(input);
  if (!parsed.success) {
    const code = parsed.error.issues.map((issue) => issue.message).find((m) => m === "nameRequired" || m === "signatureRequired" || m === "signatureTooLarge");
    return { ok: false, error: (code as "nameRequired" | "signatureRequired" | "signatureTooLarge" | undefined) ?? "invalid" };
  }
  return acceptClientQuote({ ...parsed.data, ip: await clientIp() });
}

/** Rechazar el orçamento con motivo opcional. */
export async function rejectQuoteAction(input: unknown): Promise<ClientResult> {
  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return rejectClientQuote(parsed.data);
}
