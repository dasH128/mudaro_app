import "server-only";

import type { ClientSuggestion, NewOrder, Order } from "../domain/types";
import { mockClients } from "./mock-data";
import { findOrder, saveOrder } from "./store";

// Única puerta de entrada a los datos de pedidos: páginas y acciones importan de aquí.
// TODO(supabase): sustituir los datos de ejemplo por consultas y por la Edge Function que crea la solicitud
// y genera el enlace con token (RNF-02: la clave de servicio solo existe en las Edge Functions), conservando las firmas.

/** Crea el pedido. El enlace del cliente aún no se genera: queda pendiente. */
export async function createOrder(input: NewOrder, { today }: { today: string }): Promise<Order> {
  return saveOrder(input, today);
}

/** El pedido, o undefined si no existe o no es de esta empresa. */
export async function getOrder(id: string): Promise<Order | undefined> {
  return findOrder(id);
}

/** Cliente de la empresa con ese teléfono (normalizado: +351XXXXXXXXX), para reutilizar su ficha (RF-14). */
export async function findClientByPhone(phone: string, { today }: { today: string }): Promise<ClientSuggestion | null> {
  const client = mockClients(today).find((candidate) => candidate.phone === phone);
  if (!client) return null;
  // El teléfono no sale de esta capa: la sugerencia solo lleva lo que la interfaz necesita
  return {
    id: client.id,
    name: client.name,
    type: client.type,
    email: client.email,
    orderCount: client.orderCount,
    lastOrder: client.lastOrder,
  };
}
