import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";
import type { Database } from "@mudaro/supabase";

import { formatOrderNumber } from "@/features/orders/domain/order-number";
import type { Client, ClientOrder, ClientStage, ClientSummary, ContactEvent, ClientsOverview } from "../domain/types";
import { mockClients } from "./mock-data";

// Única puerta de entrada a los datos de los clientes: las páginas importan de aquí.
// RLS: la empresa lee solo sus fichas (RNF-01). Un cliente existe desde que se crea un envío (RF-14).
//
// Qué viene de la base de datos: ficha (nombre, tipo, teléfono, email, NIF, alta), pedidos (envíos no cancelados),
// ruta, fecha, etapa, direcciones y último contacto (último evento del envío).
// Qué todavía NO existe y se rellena con un valor neutro (ver cada TODO): importes aceptados (paso 5),
// trabajos, vehículos y equipo (paso 6), objetos y volumen (paso 4b), posibles fichas repetidas.
// Mientras tanto se añaden las fichas de ejemplo, marcadas con `sample`, para ver el diseño completo.
// TODO: quitar `INCLUDE_SAMPLE` y `mock-data.ts` cuando el modelo cubra todo.

const INCLUDE_SAMPLE = true;

type ShipmentStatus = Database["public"]["Enums"]["shipment_status"];
type EventKind = Database["public"]["Enums"]["shipment_event_kind"];

const SELECT = `id, name, type, phone, email, tax_id, created_at,
  shipments(number, status, lost_reason, status_changed_at, last_activity_at, created_at,
    order:orders!inner(desired_date, token_expires_at,
      addresses(id, role, sort_order),
      inventories(version, inventory_addresses(address_id, address))),
    events:shipment_events(kind, occurred_at))`;

type Options = {
  /** Día de hoy en Lisboa (aaaa-mm-dd): las fichas de ejemplo calculan sus fechas desde él. */
  today: string;
  /** Solo el administrador ve los importes aceptados (RNF-03). Con `false` ni salen de esta capa. */
  includeValues: boolean;
};

/** aaaa-mm-dd de Lisboa a partir de un instante. */
function lisbonDay(instant: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon" }).format(new Date(instant));
}

/** Un envío cancelado no es un pedido del cliente (RF-69 aún sin pantalla): no se cuenta. */
function stageOf(status: ShipmentStatus): ClientStage | null {
  switch (status) {
    case "new":
      return "new";
    case "awaiting_inventory":
      return "awaiting-inventory";
    case "inventory_received":
      return "inventory-received";
    case "quoted":
      return "quoted";
    // TODO(paso 6): un envío ganado pasa a programado, en curso o hecho según su trabajo (`jobs`). Sin trabajos, todos salen programados.
    case "won":
      return "scheduled";
    case "lost":
      return "lost";
    case "cancelled":
      return null;
  }
}

const EVENTS: Partial<Record<EventKind, ContactEvent>> = {
  created: "order-created",
  inventory_submitted: "sent-inventory",
  won: "accepted-quote",
  lost: "declined-quote",
};

type ShipmentRow = {
  number: number;
  status: ShipmentStatus;
  lost_reason: string | null;
  status_changed_at: string;
  last_activity_at: string;
  created_at: string;
  order: {
    desired_date: string;
    token_expires_at: string | null;
    addresses: { id: string; role: Database["public"]["Enums"]["address_role"]; sort_order: number }[];
    inventories: { version: number; inventory_addresses: { address_id: string; address: string }[] }[];
  };
  events: { kind: EventKind; occurred_at: string }[];
};

/** Texto de cada dirección del pedido, con el rol, de la versión más reciente del inventario. */
function placesOf(order: ShipmentRow["order"]): { text: string; role: "origin" | "destination" | "stop" }[] {
  const latest = [...order.inventories].sort((a, b) => b.version - a.version)[0];
  const text = new Map((latest?.inventory_addresses ?? []).map((row) => [row.address_id, row.address]));
  return [...order.addresses]
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((address) => {
      const value = text.get(address.id);
      return value ? [{ text: value, role: address.role }] : [];
    });
}

/** "Lisboa → Cascais". Solo el primer tramo de cada dirección sería recortar datos de la empresa: va el texto entero. */
function routeOf(order: ShipmentRow["order"]): string {
  const places = placesOf(order);
  const origin = places.find((p) => p.role === "origin")?.text ?? "";
  const destination = places.find((p) => p.role === "destination")?.text ?? "";
  return origin && destination ? `${origin} → ${destination}` : origin || destination;
}

function summaryOf(row: ShipmentRow, stage: ClientStage, orderId: string, now: Date): ClientSummary {
  switch (stage) {
    case "new":
      return { kind: "share-link", orderId };
    case "awaiting-inventory":
      return { kind: "link-expires", orderId };
    case "inventory-received":
      return { kind: "inventory-arrived", orderId, hoursAgo: Math.max(Math.floor((now.getTime() - Date.parse(row.status_changed_at)) / 3_600_000), 0) };
    case "quoted":
      return { kind: "no-news", orderId, days: Math.max(Math.floor((now.getTime() - Date.parse(row.last_activity_at)) / 86_400_000), 0) };
    case "lost":
      return { kind: "lost", orderId, reason: row.lost_reason ?? "" };
    // TODO(paso 6): la hora y los recursos salen de `jobs`. Sin trabajo se usa la fecha deseada y "--:--".
    default:
      return { kind: "scheduled", orderId, on: row.order.desired_date, time: "--:--" };
  }
}

const ACTIVE_RANK = (stage: ClientStage): number => (stage === "lost" ? 1 : 0);

type ClientRow = {
  id: string;
  name: string;
  type: Database["public"]["Enums"]["client_type"];
  phone: string;
  email: string | null;
  tax_id: string | null;
  created_at: string;
  shipments: ShipmentRow[];
};

function toClient(row: ClientRow, now: Date): Client | null {
  const shipments = row.shipments
    .flatMap((shipment) => {
      const stage = stageOf(shipment.status);
      return stage ? [{ shipment, stage }] : [];
    })
    .sort((a, b) => b.shipment.created_at.localeCompare(a.shipment.created_at));
  // Una ficha sin envíos vivos no tiene qué enseñar en esta lista
  if (shipments.length === 0) return null;

  const orders: ClientOrder[] = shipments.map(({ shipment, stage }) => ({
    id: formatOrderNumber(shipment.number),
    route: routeOf(shipment.order),
    moveOn: shipment.order.desired_date,
    stage,
    // TODO(4b, 5 y 6): las notas de cada pedido (presupuesto, vehículo, equipo) necesitan `quotes`, `jobs` y `assignments`.
    note: { kind: "last-contact" },
    // TODO(paso 5): el importe aceptado sale de `quotes`.
    acceptedCents: null,
  }));

  // El pedido más relevante es el más reciente que sigue vivo; si todos se perdieron, el último
  const main = [...shipments].sort((a, b) => ACTIVE_RANK(a.stage) - ACTIVE_RANK(b.stage))[0]!;

  const events = shipments.flatMap(({ shipment }) => shipment.events).sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  const lastActivity = shipments.map(({ shipment }) => shipment.last_activity_at).sort().at(-1)!;
  const lastEvent = events[0];

  // Direcciones de la empresa para este cliente: las repetidas en varios pedidos se agrupan
  const seen = new Map<string, { count: number; role: "origin" | "destination" | "stop" }>();
  for (const { shipment } of shipments) {
    for (const place of placesOf(shipment.order)) {
      const known = seen.get(place.text);
      seen.set(place.text, { count: (known?.count ?? 0) + 1, role: known?.role ?? place.role });
    }
  }
  const addresses = [...seen].map(([text, { count, role }]) => ({
    text,
    use: count > 1 ? ({ kind: "orders", count } as const) : role === "origin" ? ({ kind: "origin" } as const) : role === "destination" ? ({ kind: "destination" } as const) : ({ kind: "see-order" } as const),
  }));

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    phone: row.phone,
    email: row.email,
    taxId: row.tax_id,
    sinceOn: lisbonDay(row.created_at),
    stage: main.stage,
    summary: summaryOf(main.shipment, main.stage, formatOrderNumber(main.shipment.number), now),
    lastContact: { on: lisbonDay(lastActivity), event: lastEvent ? EVENTS[lastEvent.kind] : undefined },
    orders,
    addresses,
    // TODO: detectar fichas repetidas (mismo teléfono con otro formato, mismo NIF) necesita una regla y probablemente un índice.
  };
}

/** Clientes de la empresa de la sesión. */
export async function getClientsOverview({ today, includeValues }: Options): Promise<ClientsOverview> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("clients").select(SELECT);
  if (error) throw new Error(`clients: no se pudieron leer los clientes (${error.code})`);

  const now = new Date();
  const real = data.flatMap((row) => {
    const client = toClient(row, now);
    return client ? [client] : [];
  });
  const sample = INCLUDE_SAMPLE ? mockClients(today).map((client): Client => ({ ...client, sample: true })) : [];

  const clients = [...real, ...sample];
  if (includeValues) return { clients };
  return {
    clients: clients.map((client) => ({
      ...client,
      orders: client.orders.map((order) => ({
        ...order,
        acceptedCents: null,
        note: order.note.kind === "closed" ? { kind: "last-contact" } : order.note,
      })),
    })),
  };
}
