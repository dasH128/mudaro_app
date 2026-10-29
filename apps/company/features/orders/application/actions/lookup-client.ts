"use server";

import { normalizePtPhone } from "@mudaro/validation";

import { todayLisbon } from "@/app/lib/format";
import type { ClientSuggestion } from "@/features/orders/domain/types";
import { findClientByPhone } from "@/features/orders/infrastructure/orders.repo";

// RF-14: al escribir el teléfono, sugiere el cliente si ya existe en la empresa.
export async function lookupClientAction(phone: string): Promise<ClientSuggestion | null> {
  // TODO(auth): comprobar sesión y rol, y limitar la frecuencia: sin ello se podrían enumerar clientes por teléfono.
  const normalized = typeof phone === "string" ? normalizePtPhone(phone) : null;
  if (!normalized) return null;
  return findClientByPhone(normalized, { today: todayLisbon() });
}
