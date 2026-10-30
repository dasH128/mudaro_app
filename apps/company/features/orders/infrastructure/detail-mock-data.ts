import type { DetailInventory, InventoryLine, OrderDetail, OrderEvent } from "../domain/detail";
import { ORDER_STATUSES, type Order, type OrderListItem, type OrderStatus } from "../domain/types";

// Datos de ejemplo del detalle de un pedido (P6). Se sustituyen por consultas a Supabase (RLS por company_id, RNF-01).
// Solo MD-0835 (Sofia Costa) lleva inventario, accesos y notas completos: es el pedido del prototipo.
// El resto se construye a partir de su fila de la lista y no tiene inventario.

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

const isoAgo = (now: number, ms: number) => new Date(now - ms).toISOString();
const dayAfter = (iso: string, days: number) => new Date(Date.parse(iso) + days * DAY_MS).toISOString().slice(0, 10);

function line(
  quantity: number,
  name: string,
  volumeM3: number | null,
  options: { dismantle?: boolean; fragile?: boolean; free?: boolean; photo?: boolean } = {},
): InventoryLine {
  return {
    quantity,
    name,
    volumeM3,
    flags: [...(options.fragile ? (["fragile"] as const) : []), ...(options.dismantle ? (["dismantle"] as const) : [])],
    free: options.free ?? false,
    hasPhoto: options.photo ?? false,
  };
}

function sofiaInventory(submittedAt: string): DetailInventory {
  return {
    version: 1,
    filledBy: "link",
    submittedAt,
    photoCount: 9,
    extras: ["Embalagem de loiça", "Desmontagem e montagem"],
    rooms: [
      {
        room: "living-room",
        lines: [
          line(1, "Sofá de 2 lugares", 1.2, { photo: true }),
          line(1, "Poltrona", 0.5),
          line(1, "Estante", 0.6, { dismantle: true, photo: true }),
          line(1, "Móvel de TV", 0.5),
          line(1, "Mesa de centro", 0.2),
          line(4, "Cadeira", 0.4),
        ],
      },
      {
        room: "bedroom",
        lines: [
          line(1, "Cama de casal", 1.5, { dismantle: true }),
          line(1, "Roupeiro de 2 portas", 1.4, { dismantle: true, photo: true }),
          line(1, "Cómoda", 0.9),
          line(2, "Mesa de cabeceira", 0.2),
          line(1, "Espelho antigo de pé", null, { fragile: true, free: true, photo: true }),
        ],
      },
      {
        room: "kitchen",
        lines: [
          line(1, "Frigorífico", 0.6, { photo: true }),
          line(1, "Máquina de lavar roupa", 0.4),
          line(4, "Caixa de loiça", 0.4, { fragile: true }),
        ],
      },
      { room: "boxes", lines: [line(10, "Caixa média", 1.0)] },
    ],
  };
}

function sofiaDetail(item: OrderListItem, now: number): OrderDetail {
  const createdAt = isoAgo(now, 4 * DAY_MS);
  const submittedAt = item.lastActivityAt;
  const events: OrderEvent[] = [
    { kind: "inventory-submitted", at: submittedAt, version: 1 },
    { kind: "link-shared", at: isoAgo(now, 4 * DAY_MS - 3 * MINUTE_MS), actor: "Gema", validityDays: 14 },
    { kind: "note-added", at: isoAgo(now, 4 * DAY_MS - MINUTE_MS), actor: "Gema" },
    { kind: "created", at: createdAt, actor: "Gema", source: "whatsapp" },
  ];

  return {
    id: item.id,
    client: { name: item.client, type: "private", phone: "+351913334455", email: "sofia.costa@exemplo.pt" },
    source: "whatsapp",
    createdAt,
    stage: item.stage,
    inventoryMode: "link",
    date: item.date,
    flexibility: item.flexibility,
    distanceKm: 3,
    origin: {
      role: "origin",
      place: "Arroios, Lisboa",
      access: { floor: 2, lift: "none", narrowStairs: true, parkingMeters: 30, needsParkingPermit: false },
      clientNote: "Prédio antigo, a porta da rua é estreita.",
    },
    destination: {
      role: "destination",
      place: "Graça, Lisboa",
      access: { floor: 4, lift: "small", narrowStairs: false, parkingMeters: 80, needsParkingPermit: true },
      clientNote: "Rua íngreme e estreita, os camiões grandes não passam.",
    },
    inventory: sofiaInventory(submittedAt),
    link: { createdAt: events[1].at, validUntil: dayAfter(createdAt, 14), validityDays: 14 },
    note: { text: "Pediu para ligar só depois das 18h.", author: "Gema", at: events[2].at },
    proposalCount: 0,
    events,
  };
}

/** Eventos de un pedido de la lista: un hito por etapa alcanzada, el último en su última actividad. */
function eventsFor(item: OrderListItem): OrderEvent[] {
  const last = Date.parse(item.lastActivityAt);
  const reached: OrderStatus[] = item.stage === "lost" ? ["new", "awaiting-inventory", "inventory-received", "quoted"] : ORDER_STATUSES.slice(0, ORDER_STATUSES.indexOf(item.stage) + 1);
  const total = reached.length + (item.stage === "lost" ? 1 : 0);
  const at = (index: number) => new Date(last - (total - 1 - index) * DAY_MS).toISOString();

  const events: OrderEvent[] = reached.map((status, index): OrderEvent => {
    switch (status) {
      case "new":
        return { kind: "created", at: at(index), actor: "Gema", source: null };
      case "awaiting-inventory":
        return { kind: "link-shared", at: at(index), actor: "Gema", validityDays: 14 };
      case "inventory-received":
        return { kind: "inventory-submitted", at: at(index), version: 1 };
      case "quoted":
        return { kind: "proposal-sent", at: at(index), actor: "Gema", version: item.note.kind === "proposal-sent" ? item.note.version : 1 };
      case "won":
        return { kind: "won", at: at(index) };
    }
  });
  if (item.stage === "lost") events.push({ kind: "lost", at: at(total - 1), reason: item.note.kind === "lost" ? item.note.reason : null });
  return events.reverse();
}

function genericDetail(item: OrderListItem): OrderDetail {
  const events = eventsFor(item);
  const shared = events.find((event) => event.kind === "link-shared");
  const created = events[events.length - 1].at;

  return {
    id: item.id,
    client: { name: item.client, type: "private", phone: null, email: null },
    source: null,
    createdAt: created,
    stage: item.stage,
    inventoryMode: "link",
    date: item.date,
    flexibility: item.flexibility,
    distanceKm: null,
    origin: { role: "origin", place: item.from, access: null, clientNote: null },
    destination: { role: "destination", place: item.to, access: null, clientNote: null },
    inventory: null,
    link: shared ? { createdAt: shared.at, validUntil: dayAfter(shared.at, 14), validityDays: 14 } : null,
    note: null,
    proposalCount: events.filter((event) => event.kind === "proposal-sent").length,
    events,
  };
}

/** Detalle de un pedido de la lista de ejemplo. */
export function mockOrderDetail(item: OrderListItem, now: Date): OrderDetail {
  return item.id === "MD-0835" ? sofiaDetail(item, now.getTime()) : genericDetail(item);
}

/** Detalle de un pedido creado en esta sesión (almacén en memoria): solo sabemos lo que pidió el formulario. */
export function detailFromCreatedOrder(order: Order, now: Date): OrderDetail {
  const createdAt = now.toISOString();
  return {
    id: order.id,
    client: { name: order.clientName, type: "private", phone: null, email: null },
    source: null,
    createdAt,
    stage: order.status,
    inventoryMode: order.inventoryMode,
    date: order.date,
    flexibility: order.flexibility,
    distanceKm: null,
    origin: { role: "origin", place: order.origin, access: null, clientNote: null },
    destination: { role: "destination", place: order.destination, access: null, clientNote: null },
    inventory: null,
    link:
      order.linkValidUntil && order.linkValidityDays
        ? { createdAt, validUntil: order.linkValidUntil, validityDays: order.linkValidityDays }
        : null,
    note: null,
    proposalCount: 0,
    events: [{ kind: "created", at: createdAt, actor: "Gema", source: null }],
  };
}
