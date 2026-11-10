"use server";

import { normalizePtPhone } from "@mudaro/validation";

import { requireCompanySession } from "@/features/auth/application/require-session";
import type { ClientSuggestion } from "@/features/orders/domain/types";
import { findClientByPhone } from "@/features/orders/infrastructure/orders.repo";

// RF-14: al escribir el teléfono, sugiere el cliente si ya existe en la empresa.
export async function lookupClientAction(phone: string): Promise<ClientSuggestion | null> {
  // Sesión y rol en servidor; RLS filtra por empresa. Pendiente: limitar la frecuencia para evitar enumerar clientes por teléfono.
  await requireCompanySession(null);
  const normalized = typeof phone === "string" ? normalizePtPhone(phone) : null;
  if (!normalized) return null;
  return findClientByPhone(normalized);
}
