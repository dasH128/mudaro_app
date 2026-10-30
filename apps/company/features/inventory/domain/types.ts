// Entidades del inventario de un pedido (RF-19). TypeScript puro: sin React, Next ni Supabase.
// Los volúmenes van en m³ y los precios en céntimos; el formato lo pone la interfaz.

/** Divisiones de la vivienda con catálogo. */
export const ROOM_KEYS = ["living-room", "bedroom", "kitchen", "bathroom", "boxes"] as const;
export type RoomKey = (typeof ROOM_KEYS)[number];

/** Marcas de un objeto que cambian el trabajo de la equipa. */
export const ITEM_FLAGS = ["fragile", "dismantle"] as const;
export type ItemFlag = (typeof ITEM_FLAGS)[number];

/** Objeto del catálogo de la empresa. El nombre es un dato de la empresa: no se traduce. */
export type CatalogItem = {
  id: string;
  room: RoomKey;
  name: string;
  /** Volumen por unidad, en m³. */
  volumeM3: number;
  flags: readonly ItemFlag[];
};

/** Pasos del editor, en orden. */
export const INVENTORY_STEPS = ["items", "access", "extras"] as const;
export type InventoryStep = (typeof INVENTORY_STEPS)[number];

export const LIFT_SIZES = ["none", "small", "normal"] as const;
export type LiftSize = (typeof LIFT_SIZES)[number];

/** Condiciones de acceso del origen o del destino. */
export type AccessPoint = {
  floor: string;
  /** Distancia de estacionamiento, en metros (texto del campo). */
  parkingMeters: string;
  lift: LiftSize | null;
  narrowStairs: boolean;
  needsParkingPermit: boolean;
  notes: string;
};

export const EMPTY_ACCESS: AccessPoint = {
  floor: "",
  parkingMeters: "",
  lift: null,
  narrowStairs: false,
  needsParkingPermit: false,
  notes: "",
};

/** Cómo se cobra un servicio extra. */
export type ExtraPricing = { kind: "unit" | "hour" | "m3-month" | "fixed"; cents: number };

/** Servicio extra activo en Tarifas y extras. El nombre es un dato de la empresa: no se traduce. */
export type ExtraService = {
  id: string;
  name: string;
  pricing: ExtraPricing;
  /** Cantidad inicial al elegirlo, si el servicio se cuenta (cajas u horas). */
  defaultQuantity: { value: number; unit: "boxes" | "hours" } | null;
};

export type InventorySummary = {
  volumeM3: number;
  items: number;
  fragile: number;
  dismantle: number;
};

/** Totales declarados, antes del factor de estiba. `quantities` es la cantidad por id de objeto. */
export function summarize(catalog: readonly CatalogItem[], quantities: Readonly<Record<string, number>>): InventorySummary {
  const total: InventorySummary = { volumeM3: 0, items: 0, fragile: 0, dismantle: 0 };
  for (const item of catalog) {
    const quantity = quantities[item.id] ?? 0;
    if (quantity <= 0) continue;
    total.items += quantity;
    total.volumeM3 += quantity * item.volumeM3;
    if (item.flags.includes("fragile")) total.fragile += quantity;
    if (item.flags.includes("dismantle")) total.dismantle += quantity;
  }
  return total;
}

/** Objetos de una división que ya llevan cantidad. */
export function countInRoom(catalog: readonly CatalogItem[], quantities: Readonly<Record<string, number>>, room: RoomKey): number {
  return catalog.reduce((sum, item) => (item.room === room ? sum + (quantities[item.id] ?? 0) : sum), 0);
}

/** Quita acentos y mayúsculas para comparar texto: "Sofá" y "sofa" coinciden. */
export function normalizeSearch(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase().trim();
}
