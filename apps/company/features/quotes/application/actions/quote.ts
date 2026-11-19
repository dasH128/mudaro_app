"use server";

import { redirect } from "next/navigation";

import { ROUTES, localePath } from "@/app/lib/routes";
import { requireCompanySession } from "@/features/auth/application/require-session";
import type { QuoteSaveResult } from "../../domain/editor";
import { orderUuidOf, saveQuoteDraft, sendQuote } from "../../infrastructure/quotes.repo";
import { parseQuote, toDatabase } from "../schemas/quote";

// Editor de orçamento. Cada acción comprueba sesión y rol, valida con zod y llama al repo; save_quote_draft y
// send_quote vuelven a comprobar en la base que el envío es de la empresa.

function langOf(input: unknown): unknown {
  return typeof input === "object" && input !== null && "lang" in input ? input.lang : undefined;
}

async function save(input: unknown): Promise<QuoteSaveResult & { lang?: string; orderId?: string }> {
  const parsed = parseQuote(input);
  if (!parsed.ok) return parsed;
  const uuid = await orderUuidOf(parsed.data.orderId);
  if (!uuid) return { ok: false, error: "notAllowed" };
  const { quote, lines } = toDatabase(parsed.data);
  const saved = await saveQuoteDraft(uuid, quote, lines);
  return saved.ok ? { ...saved, lang: parsed.data.lang, orderId: parsed.data.orderId } : saved;
}

/** "Guardar rascunho". */
export async function saveQuoteAction(input: unknown): Promise<QuoteSaveResult> {
  await requireCompanySession(langOf(input));
  const saved = await save(input);
  return saved.ok ? { ok: true, quoteId: saved.quoteId } : saved;
}

/** "Enviar orçamento": guarda, envía y vuelve al pedido, en la pestaña Orçamentos. */
export async function sendQuoteAction(input: unknown): Promise<QuoteSaveResult> {
  await requireCompanySession(langOf(input));
  const saved = await save(input);
  if (!saved.ok) return saved;
  const sent = await sendQuote(saved.quoteId);
  if (!sent.ok) return sent;
  redirect(`${localePath(saved.lang as "pt", ROUTES.orders.detail(saved.orderId as string))}?tab=quotes`);
}
