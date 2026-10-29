// Entidades de los pedidos (M4: solicitudes). TypeScript puro: sin React, Next ni Supabase.
// Las fechas van en ISO (aaaa-mm-dd) y los teléfonos normalizados (+351XXXXXXXXX); el formato lo pone la interfaz.

export const CLIENT_TYPES = ["private", "company"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

/** Margen de la fecha aproximada de la mudanza. */
export const FLEXIBILITIES = ["exact", "two-days", "one-week", "month"] as const;
export type Flexibility = (typeof FLEXIBILITIES)[number];

/** Cómo llegó el contacto. */
export const SOURCES = ["phone", "whatsapp", "referral", "website", "other"] as const;
export type Source = (typeof SOURCES)[number];

/** Quién rellena el inventario: el cliente por el enlace (RF-15) o la empresa (RF-19). */
export const INVENTORY_MODES = ["link", "self"] as const;
export type InventoryMode = (typeof INVENTORY_MODES)[number];

/** Días que el enlace del cliente queda activo (RF-15). */
export const LINK_VALIDITY_DAYS = [7, 14, 30] as const;
export type LinkValidityDays = (typeof LINK_VALIDITY_DAYS)[number];
export const DEFAULT_LINK_VALIDITY_DAYS: LinkValidityDays = 14;

/** Máximo de paradas intermedias entre el origen y el destino. Provisional. */
export const MAX_STOPS = 3;

/** Ciclo de vida del pedido, en orden. */
export const ORDER_STATUSES = ["new", "awaiting-inventory", "inventory-received", "quoted", "won"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Lo que se pide para crear un pedido (RF-13). */
export type NewOrder = {
  /** Teléfono normalizado: +351XXXXXXXXX. */
  phone: string;
  name: string;
  clientType: ClientType;
  email: string | null;
  taxId: string | null;
  /** Ficha de cliente existente reutilizada (RF-14), o `null` si es un cliente nuevo. */
  clientId: string | null;
  origin: string;
  destination: string;
  stops: readonly string[];
  /** Fecha aproximada, aaaa-mm-dd. */
  date: string;
  flexibility: Flexibility;
  source: Source | null;
  inventoryMode: InventoryMode;
  /** Solo con `inventoryMode === "link"`. */
  linkValidityDays: LinkValidityDays | null;
};

export type Order = {
  /** Número de pedido (MD-0836). */
  id: string;
  clientName: string;
  origin: string;
  destination: string;
  stops: readonly string[];
  date: string;
  flexibility: Flexibility;
  inventoryMode: InventoryMode;
  status: OrderStatus;
  /** Último día de validez del enlace, aaaa-mm-dd. `null` si el inventario lo rellena la empresa. */
  linkValidUntil: string | null;
  linkValidityDays: LinkValidityDays | null;
};

/** Cliente que ya existe en la empresa, sugerido al escribir su teléfono (RF-14). */
export type ClientSuggestion = {
  id: string;
  name: string;
  type: ClientType;
  email: string | null;
  orderCount: number;
  lastOrder: { id: string; completedOn: string } | null;
};
