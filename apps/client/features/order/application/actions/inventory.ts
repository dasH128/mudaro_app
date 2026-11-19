"use server";

import { parseClientInventory } from "@/features/order/application/schemas/inventory";
import type { ClientResult } from "@/features/order/domain/types";
import { saveClientDraft, submitClientInventory } from "@/features/order/infrastructure/client-order.repo";

// El cliente no tiene sesión: la autorización es el token del enlace, que comprueba la Edge Function `client-order`
// (hash, pedido no cancelado y enlace vigente). Aquí solo se valida la forma de los datos.

/** Guarda el borrador al cambiar de paso. */
export async function saveClientInventoryAction(input: unknown): Promise<ClientResult> {
  const parsed = parseClientInventory(input, "save");
  if (!parsed.ok) return parsed;
  return saveClientDraft(parsed.token, parsed.changes);
}

/** Guarda todo y envía el inventario a la empresa (RF-26). */
export async function submitClientInventoryAction(input: unknown): Promise<ClientResult> {
  const parsed = parseClientInventory(input, "submit");
  if (!parsed.ok) return parsed;
  return submitClientInventory(parsed.token, parsed.changes);
}
