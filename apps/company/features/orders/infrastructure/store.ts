import type { NewOrder, Order } from "../domain/types";

// Almacén en memoria de los pedidos creados: se pierde al reiniciar el servidor.
// TODO(supabase): sustituir por la tabla de solicitudes y una Edge Function (paso 4 del plan de BD).
// Va en `globalThis` para que la acción y la página compartan el mismo almacén en desarrollo.

type StoreState = { orders: Map<string, Order>; sequence: number };

const holder = globalThis as typeof globalThis & { __mudaroOrders?: StoreState };

function state(): StoreState {
  return (holder.__mudaroOrders ??= { orders: new Map(), sequence: 836 });
}

/** Suma días a un aaaa-mm-dd. */
function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

export function saveOrder(input: NewOrder, today: string): Order {
  const store = state();
  store.sequence += 1;

  const order: Order = {
    id: `MD-${String(store.sequence).padStart(4, "0")}`,
    clientName: input.name,
    origin: input.origin,
    destination: input.destination,
    stops: input.stops,
    date: input.date,
    flexibility: input.flexibility,
    inventoryMode: input.inventoryMode,
    status: "new",
    linkValidityDays: input.linkValidityDays,
    linkValidUntil: input.linkValidityDays === null ? null : addDays(today, input.linkValidityDays),
  };
  store.orders.set(order.id, order);
  return order;
}

export function findOrder(id: string): Order | undefined {
  return state().orders.get(id);
}

/** Pedidos creados en esta sesión, el más reciente primero. */
export function listOrders(): Order[] {
  return [...state().orders.values()].reverse();
}
