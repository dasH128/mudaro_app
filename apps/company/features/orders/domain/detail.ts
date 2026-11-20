// Detalle de un pedido (P6). TypeScript puro: sin React, Next ni Supabase.
// Las fechas van en ISO (aaaa-mm-dd o con hora) y los volúmenes en m³; el formato lo pone la interfaz.

import type { ItemFlag, LiftSize } from "@/features/inventory/domain/types";
import type { ClientType, Flexibility, InventoryMode, OrderStage, OrderStatus, Source } from "./types";

/** Ficha del cliente del pedido. El teléfono va normalizado (+351XXXXXXXXX). */
export type DetailClient = {
  name: string;
  type: ClientType;
  phone: string | null;
  email: string | null;
};

/** Condiciones de acceso de una dirección, ya interpretadas (el inventario las guarda como texto de formulario). */
export type AddressAccess = {
  /** 0 = rés-do-chão. */
  floor: number;
  lift: LiftSize;
  narrowStairs: boolean;
  parkingMeters: number;
  needsParkingPermit: boolean;
};

export type DetailAddress = {
  role: "origin" | "stop" | "destination";
  /** Número de la parada (1, 2, 3). `null` en origen y destino. */
  stopNumber: number | null;
  /** Zona de la dirección, tal como la escribió la empresa o el cliente: "Arroios, Lisboa". */
  place: string;
  /** `null` mientras no haya inventario con accesos. */
  access: AddressAccess | null;
  clientNote: string | null;
};

/** Línea del inventario. El nombre es dato de la empresa: no se traduce. */
export type InventoryLine = {
  quantity: number;
  name: string;
  /** Volumen de toda la línea. `null` = sin medidas: no entra en el total hasta estimarlo. */
  volumeM3: number | null;
  flags: readonly ItemFlag[];
  /** Objeto libre (fuera del catálogo). */
  free: boolean;
  hasPhoto: boolean;
};

/** División del inventario. `name` llega traducido del catálogo; vacío si la línea no tiene división. */
export type InventoryRoom = { slug: string; name: string; lines: readonly InventoryLine[] };

export type DetailInventory = {
  version: number;
  filledBy: InventoryMode;
  submittedAt: string;
  rooms: readonly InventoryRoom[];
  /** Fotos que adjuntó el cliente (pueden ser más que las líneas con foto). */
  photoCount: number;
  /** Servicios extra pedidos: nombres de la empresa. */
  extras: readonly string[];
};

/** Enlace del cliente (RF-15). El token no sale de la capa de infraestructura. */
export type DetailLink = {
  createdAt: string;
  /** Último día de validez, aaaa-mm-dd. */
  validUntil: string;
  validityDays: number;
};

export type DetailNote = { text: string; author: string; at: string };

export type OrderEvent =
  | { kind: "created"; at: string; actor: string; source: Source | null }
  | { kind: "note-added"; at: string; actor: string }
  | { kind: "link-shared"; at: string; actor: string; validityDays: number }
  /** `by`: quién envió la versión. La empresa la envía cuando rellena ella el inventario (RF-19). */
  | { kind: "inventory-submitted"; at: string; version: number; by: "client" | "company"; actor: string }
  | { kind: "quote-sent"; at: string; actor: string; version: number }
  | { kind: "won"; at: string }
  | { kind: "lost"; at: string; reason: string | null }
  /** Agenda (paso 6.1): equipo y vehículo atribuidos, trabajo reprogramado o cancelado. */
  | { kind: "job-assigned"; at: string; actor: string }
  | { kind: "job-rescheduled"; at: string; actor: string }
  | { kind: "job-cancelled"; at: string; actor: string; reason: string | null };

export type OrderDetail = {
  id: string;
  client: DetailClient;
  source: Source | null;
  createdAt: string;
  stage: OrderStage;
  inventoryMode: InventoryMode;
  /** Fecha aproximada de la mudança, aaaa-mm-dd. */
  date: string;
  flexibility: Flexibility;
  /** Distancia entre origen y destino. `null` hasta calcularla (se calcula en el presupuesto). */
  distanceKm: number | null;
  origin: DetailAddress;
  /** Paradas intermedias, en el orden del recorrido. */
  stops: readonly DetailAddress[];
  destination: DetailAddress;
  inventory: DetailInventory | null;
  link: DetailLink | null;
  note: DetailNote | null;
  quoteCount: number;
  /** Orçamentos del envío, de la versión más reciente a la más antigua (paso 5). */
  quotes: readonly DetailQuote[];
  /** Trabajo creado al aceptar el orçamento (RF-46). `null` mientras no se gane el envío. */
  job: DetailJob | null;
  /** Del más reciente al más antiguo. */
  events: readonly OrderEvent[];
};

/** Una versión de orçamento en la pestaña Orçamentos del pedido. Importes con IVA, en céntimos. */
export type DetailQuote = {
  /** Número compartido por las versiones (1 → ORC-0001). */
  number: number;
  version: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "superseded";
  /** Total con IVA sin los opcionales; si está aceptado, el importe firmado. */
  totalCents: number;
  /** Último día de validez, aaaa-mm-dd. `null` en un borrador. */
  validUntil: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedReason: string | null;
  /** Versión del inventario sobre la que se calculó. */
  inventoryVersion: number;
};

/** Trabajo programado del envío. Equipo y vehículo se asignan en el paso 6. */
export type DetailJob = {
  status: "scheduled" | "in_progress" | "delivered" | "closed" | "cancelled";
  /** Inicio y fin previstos, instantes ISO. */
  scheduledStart: string;
  scheduledEnd: string;
  /** Asignado en la agenda (paso 6.2): nombres de vehículos y personas; `lead`, el jefe de equipo. */
  vehicles: string[];
  crew: string[];
  lead: string | null;
};

/** Recorrido completo: origen, paradas y destino, en ese orden. */
export function routeOf(order: Pick<OrderDetail, "origin" | "stops" | "destination">): DetailAddress[] {
  return [order.origin, ...order.stops, order.destination];
}

// --- Percurso ---

/** Hitos del pedido, en orden. */
export const JOURNEY_STEPS = ["created", "link-shared", "inventory-submitted", "quote-sent", "won"] as const;
/** "lost" sustituye a "Ganho" cuando el cliente rechaza el orçamento. */
export type JourneyStep = (typeof JOURNEY_STEPS)[number] | "lost";

export type JourneyItem = {
  step: JourneyStep;
  state: "done" | "current" | "todo" | "lost";
  /** Cuándo ocurrió, si hay evento. */
  at: string | null;
};

/** Hito en el que está cada estado del pedido. */
const STEP_OF_STATUS: Record<OrderStatus, JourneyStep> = {
  new: "created",
  "awaiting-inventory": "link-shared",
  "inventory-received": "inventory-submitted",
  quoted: "quote-sent",
  won: "won",
};

/** Cuándo se alcanzó un hito: el evento más reciente de ese tipo. */
function eventTime(events: readonly OrderEvent[], step: JourneyStep): string | null {
  // Cada hito tiene el mismo nombre que su evento
  return events.find((event) => event.kind === step)?.at ?? null;
}

/**
 * Percurso del pedido: lo alcanzado, el hito actual y lo que falta.
 * Un pedido perdido deja hecho todo hasta el presupuesto y cambia "Ganho" por "Perdido".
 * Con el inventario rellenado por la empresa no hay paso "Link partilhado": el enlace solo sirve para el orçamento y
 * puede no generarse nunca.
 */
export function buildJourney(stage: OrderStage, events: readonly OrderEvent[], mode: InventoryMode): JourneyItem[] {
  const steps: readonly JourneyStep[] = mode === "self" ? JOURNEY_STEPS.filter((step) => step !== "link-shared") : JOURNEY_STEPS;
  const reached = stage === "lost" ? "quote-sent" : STEP_OF_STATUS[stage];
  const current = steps.indexOf(reached === "link-shared" && mode === "self" ? "created" : reached);
  return steps.map((step, index): JourneyItem => {
    if (stage === "lost" && step === "won") return { step: "lost", state: "lost", at: eventTime(events, "lost") };
    return {
      step,
      state: index < current || (stage === "lost" && index === current) ? "done" : index === current ? "current" : "todo",
      at: index <= current ? eventTime(events, step) : null,
    };
  });
}

// --- Inventario ---

export type InventoryTotals = {
  items: number;
  volumeM3: number;
  /** Líneas sin medidas. */
  missingMeasures: number;
  fragile: number;
  dismantle: number;
  rooms: number;
};

export function summarizeLines(lines: readonly InventoryLine[]) {
  return lines.reduce(
    (total, line) => {
      total.items += line.quantity;
      if (line.volumeM3 === null) total.missingMeasures += 1;
      else total.volumeM3 += line.volumeM3;
      if (line.flags.includes("fragile")) total.fragile += line.quantity;
      if (line.flags.includes("dismantle")) total.dismantle += line.quantity;
      return total;
    },
    { items: 0, volumeM3: 0, missingMeasures: 0, fragile: 0, dismantle: 0 },
  );
}

export function summarizeInventory(inventory: DetailInventory): InventoryTotals {
  const total = { items: 0, volumeM3: 0, missingMeasures: 0, fragile: 0, dismantle: 0, rooms: inventory.rooms.length };
  for (const { lines } of inventory.rooms) {
    const part = summarizeLines(lines);
    total.items += part.items;
    total.volumeM3 += part.volumeM3;
    total.missingMeasures += part.missingMeasures;
    total.fragile += part.fragile;
    total.dismantle += part.dismantle;
  }
  return total;
}

/** Primera línea sin medidas, para nombrarla en el aviso. */
export function firstMissingMeasure(inventory: DetailInventory): InventoryLine | null {
  for (const { lines } of inventory.rooms) {
    const line = lines.find((candidate) => candidate.volumeM3 === null);
    if (line) return line;
  }
  return null;
}

// --- Accesos ---

/** A partir de esta distancia el estacionamiento cuenta como un problema para el camión. Provisional. */
export const FAR_PARKING_METERS = 50;

export function accessFlags(access: AddressAccess) {
  return {
    noLift: access.lift === "none" && access.floor > 0,
    narrowStairs: access.narrowStairs,
    farParking: access.parkingMeters > FAR_PARKING_METERS,
    parkingPermit: access.needsParkingPermit,
  };
}

// --- Enlace del cliente ---

export type LinkState = {
  status: "active" | "expired" | "closed";
  daysLeft: number;
  daysUsed: number;
  /** 0..1 */
  usedRatio: number;
};

/** Días entre dos aaaa-mm-dd. */
function daysBetweenDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Estado del enlace: tras ganar o perder el pedido deja de servir aunque no haya caducado. */
export function linkState(link: DetailLink, stage: OrderStage, today: string): LinkState {
  const daysLeft = Math.max(daysBetweenDays(today, link.validUntil), 0);
  const daysUsed = Math.min(Math.max(link.validityDays - daysLeft, 0), link.validityDays);
  // Solo un orçamento aceite cierra el pedido. Tras un rechazo el enlace sigue abierto: ahí verá el cliente la versión nueva.
  const status = stage === "won" ? "closed" : daysBetweenDays(today, link.validUntil) < 0 ? "expired" : "active";
  return { status, daysLeft, daysUsed, usedRatio: link.validityDays > 0 ? daysUsed / link.validityDays : 1 };
}

// --- Pestañas ---

export const DETAIL_TABS = ["summary", "inventory", "addresses", "quotes", "history"] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];
export const DEFAULT_TAB: DetailTab = "summary";

export function isDetailTab(value: string | undefined): value is DetailTab {
  return DETAIL_TABS.includes(value as DetailTab);
}
