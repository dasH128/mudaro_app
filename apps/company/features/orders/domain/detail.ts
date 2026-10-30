// Detalle de un pedido (P6). TypeScript puro: sin React, Next ni Supabase.
// Las fechas van en ISO (aaaa-mm-dd o con hora) y los volúmenes en m³; el formato lo pone la interfaz.

import type { ItemFlag, LiftSize, RoomKey } from "@/features/inventory/domain/types";
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
  role: "origin" | "destination";
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

export type InventoryRoom = { room: RoomKey; lines: readonly InventoryLine[] };

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
  | { kind: "inventory-submitted"; at: string; version: number }
  | { kind: "proposal-sent"; at: string; actor: string; version: number }
  | { kind: "won"; at: string }
  | { kind: "lost"; at: string; reason: string | null };

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
  /** Distancia entre origen y destino. `null` hasta calcularla (se calcula en la proposta). */
  distanceKm: number | null;
  origin: DetailAddress;
  destination: DetailAddress;
  inventory: DetailInventory | null;
  link: DetailLink | null;
  note: DetailNote | null;
  proposalCount: number;
  /** Del más reciente al más antiguo. */
  events: readonly OrderEvent[];
};

// --- Percurso ---

/** Hitos del pedido, en orden. */
export const JOURNEY_STEPS = ["created", "link-shared", "inventory-submitted", "proposal-sent", "won"] as const;
export type JourneyStep = (typeof JOURNEY_STEPS)[number];

export type JourneyItem = {
  step: JourneyStep;
  state: "done" | "current" | "todo";
  /** Cuándo ocurrió, si hay evento. */
  at: string | null;
};

/** Hito en el que está cada estado del pedido. */
const STEP_OF_STATUS: Record<OrderStatus, JourneyStep> = {
  new: "created",
  "awaiting-inventory": "link-shared",
  "inventory-received": "inventory-submitted",
  quoted: "proposal-sent",
  won: "won",
};

/** Cuándo se alcanzó un hito: el evento más reciente de ese tipo. */
function eventTime(events: readonly OrderEvent[], step: JourneyStep): string | null {
  // Cada hito tiene el mismo nombre que su evento
  return events.find((event) => event.kind === step)?.at ?? null;
}

/**
 * Percurso del pedido: lo alcanzado, el hito actual y lo que falta.
 * Un pedido perdido deja hecho todo hasta la proposta y ninguno como actual.
 */
export function buildJourney(stage: OrderStage, events: readonly OrderEvent[]): JourneyItem[] {
  const current = stage === "lost" ? JOURNEY_STEPS.indexOf("proposal-sent") : JOURNEY_STEPS.indexOf(STEP_OF_STATUS[stage]);
  return JOURNEY_STEPS.map((step, index) => ({
    step,
    state: index < current || (stage === "lost" && index === current) ? "done" : index === current ? "current" : "todo",
    at: index <= current ? eventTime(events, step) : null,
  }));
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
  const status = stage === "won" || stage === "lost" ? "closed" : daysBetweenDays(today, link.validUntil) < 0 ? "expired" : "active";
  return { status, daysLeft, daysUsed, usedRatio: link.validityDays > 0 ? daysUsed / link.validityDays : 1 };
}

// --- Pestañas ---

export const DETAIL_TABS = ["summary", "inventory", "addresses", "proposals", "history"] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];
export const DEFAULT_TAB: DetailTab = "summary";

export function isDetailTab(value: string | undefined): value is DetailTab {
  return DETAIL_TABS.includes(value as DetailTab);
}
