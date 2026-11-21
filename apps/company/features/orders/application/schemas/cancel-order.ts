import { z } from "zod";

import { LOCALES } from "@/app/i18n/config";
import type { CancelOrderError } from "../../domain/types";
import { parseOrderNumber } from "../../domain/order-number";

// Cancelar un pedido (RF-69). Los errores son códigos que traduce el formulario.

export type Lang = (typeof LOCALES)[number];

export type CancelOrderState = { status: "idle" } | { status: "done"; at: number } | { status: "error"; error: CancelOrderError };

const field = (formData: FormData, name: string) => {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw : "";
};

const head = z.object({
  lang: z.enum(LOCALES),
  orderId: z.string().refine((id) => parseOrderNumber(id) !== null),
});

/** Idioma, número del pedido (MD-0836) y motivo obligatorio, como en la base (1 a 500 caracteres). */
export function parseCancelOrder(
  formData: FormData,
): { ok: true; lang: Lang; orderId: string; reason: string } | { ok: false; error: CancelOrderError } {
  const parsed = head.safeParse({ lang: field(formData, "lang"), orderId: field(formData, "orderId") });
  if (!parsed.success) return { ok: false, error: "failed" };
  const reason = z.string().trim().min(1).max(500).safeParse(field(formData, "reason"));
  if (!reason.success) return { ok: false, error: "reasonRequired" };
  return { ok: true, lang: parsed.data.lang, orderId: parsed.data.orderId, reason: reason.data };
}
