"use server";

import { redirect } from "next/navigation";

import { hasLocale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { parseInventory } from "@/features/inventory/application/schemas/inventory";
import type { InventoryResult } from "@/features/inventory/domain/types";
import {
  openInventoryDraft,
  saveInventoryDraft,
  submitInventory,
} from "@/features/inventory/infrastructure/inventory.repo";

// Inventário (RF-19 a RF-27). Cada acción comprueba sesión y rol, valida con zod y llama al repo; la base de datos
// vuelve a comprobar que el pedido es de la empresa de la sesión.

function langOf(input: unknown): unknown {
  return typeof input === "object" && input !== null && "lang" in input ? input.lang : undefined;
}

/** Guarda el borrador (al cambiar de paso o al salir). Los accesos a medias se quedan en pantalla sin guardar. */
export async function saveInventoryAction(input: unknown): Promise<InventoryResult> {
  await requireCompanySession(langOf(input));
  const parsed = parseInventory(input, "save");
  if (!parsed.ok) return parsed;
  return saveInventoryDraft(parsed.data.orderId, parsed.data.changes);
}

/** Guarda todo y envía la versión: el pedido pasa a "Inventário recebido" (RF-26). Vuelve al detalle del pedido. */
export async function submitInventoryAction(input: unknown): Promise<InventoryResult> {
  await requireCompanySession(langOf(input));
  const parsed = parseInventory(input, "submit");
  if (!parsed.ok) return parsed;

  const { lang, orderId, changes } = parsed.data;
  const saved = await saveInventoryDraft(orderId, changes);
  if (!saved.ok) return saved;
  const submitted = await submitInventory(orderId);
  if (!submitted.ok) return submitted;

  redirect(localePath(lang, ROUTES.orders.detail(orderId)));
}

/** "Editar inventário" de una versión enviada: abre la versión siguiente (RF-27) y vuelve al editor. */
export async function openInventoryDraftAction(formData: FormData): Promise<void> {
  const lang = formData.get("lang");
  await requireCompanySession(lang);
  const orderId = formData.get("orderId");
  if (typeof lang !== "string" || !hasLocale(lang) || typeof orderId !== "string") return;

  // Si falla (pedido cancelado o ajeno), la página vuelve a mostrar el estado real del pedido.
  await openInventoryDraft(orderId);
  redirect(localePath(lang, ROUTES.orders.inventory(orderId)));
}
