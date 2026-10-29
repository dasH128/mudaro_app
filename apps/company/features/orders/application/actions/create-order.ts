"use server";

import { redirect } from "next/navigation";

import { todayLisbon } from "@/app/lib/format";
import { ROUTES, localePath } from "@/app/lib/routes";
import { parseNewOrder, readValues } from "@/features/orders/application/schemas/new-order";
import { createOrder } from "@/features/orders/infrastructure/orders.repo";

import type { FormState } from "./state";

// RF-13: crear un pedido con lo mínimo. RF-19: o seguir al inventario si lo rellena la empresa.
export async function createOrderAction(_previous: FormState, formData: FormData): Promise<FormState> {
  // TODO(auth): el grupo (app) aún no tiene sesión. Antes de conectar datos reales, aquí se comprueba
  // sesión y rol en servidor (una Server Action es un endpoint público), además de RLS.
  const parsed = parseNewOrder(readValues(formData));
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.fieldErrors };

  const { lang, order } = parsed.data;
  const created = await createOrder(order, { today: todayLisbon() });

  // Con enlace, se sigue a "pedido criado". Sin enlace, al inventario (pendiente de crear).
  const next = order.inventoryMode === "link" ? ROUTES.orders.created(created.id) : ROUTES.orders.inventory(created.id);
  redirect(localePath(lang, next));
}
