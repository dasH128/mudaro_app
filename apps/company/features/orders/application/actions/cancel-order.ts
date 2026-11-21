"use server";

import { revalidatePath } from "next/cache";

import { ROUTES, localePath } from "@/app/lib/routes";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { cancelOrder } from "@/features/orders/infrastructure/orders.repo";
import { parseCancelOrder, type CancelOrderState } from "../schemas/cancel-order";

/**
 * "Cancelar pedido" (RF-69): con motivo. Cancela el pedido, su envío y el trabajo si estaba programado. Comprueba sesión
 * y rol en servidor; `cancel_order()` vuelve a comprobar en la base que el pedido es de la empresa y se puede cancelar.
 * Si va bien, el detalle se refresca y muestra el pedido cancelado.
 */
export async function cancelOrderAction(_previous: CancelOrderState, formData: FormData): Promise<CancelOrderState> {
  await requireCompanySession(formData.get("lang"));
  const parsed = parseCancelOrder(formData);
  if (!parsed.ok) return { status: "error", error: parsed.error };

  const result = await cancelOrder(parsed.orderId, parsed.reason);
  if (!result.ok) return { status: "error", error: result.error };

  // El pedido o su trabajo salen en casi todas las pantallas (lista, detalle, agenda, início, clientes, orçamentos)
  revalidatePath(localePath(parsed.lang, ROUTES.home), "layout");
  return { status: "done", at: Date.now() };
}
