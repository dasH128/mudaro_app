import "server-only";

import type { Client, ClientsOverview } from "../domain/types";
import { mockClients } from "./mock-data";

// Única puerta de entrada a los datos de los clientes: las páginas importan de aquí.
// TODO(supabase): sustituir los datos de ejemplo por consultas (RLS por company_id, RNF-01), conservando la firma.

type Options = {
  /** Día de hoy en Lisboa (aaaa-mm-dd): las fechas de ejemplo se calculan desde él. */
  today: string;
  /** Solo el administrador ve los importes aceptados (RNF-03). Con `false` ni salen de esta capa. */
  includeValues: boolean;
};

/** Clientes de la empresa de la sesión. */
export async function getClientsOverview({ today, includeValues }: Options): Promise<ClientsOverview> {
  const hideValues = (client: Client): Client => ({
    ...client,
    orders: client.orders.map((order) => ({
      ...order,
      acceptedCents: null,
      note: order.note.kind === "closed" ? { kind: "last-contact" } : order.note,
    })),
  });
  const clients = mockClients(today);
  return { clients: includeValues ? clients : clients.map(hideValues) };
}
