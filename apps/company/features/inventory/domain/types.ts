// Entidades del inventario de un pedido (RF-19). TypeScript puro: sin React, Next ni Supabase.
// Los volúmenes van en m³ y los precios en céntimos; el formato lo pone la interfaz.

/** Marcas de un objeto que cambian el trabajo de la equipa. */
export const ITEM_FLAGS = ["fragile", "dismantle", "extra-crew"] as const;
export type ItemFlag = (typeof ITEM_FLAGS)[number];

/**
 * División del catálogo de Mudaro (`catalog_rooms`). El nombre llega ya en el idioma de la interfaz.
 * `slug` es la clave estable: es lo que guarda cada línea del inventario.
 */
export type CatalogRoom = { slug: string; name: string };

/** Objeto del catálogo de Mudaro (`catalog_items`), con el nombre en el idioma de la interfaz. */
export type CatalogItem = {
  /** Id del catálogo (uuid). */
  id: string;
  /** Divisiones donde aparece (slugs). Un objeto puede estar en varias: la silla en la sala y en la cocina. */
  rooms: readonly string[];
  name: string;
  /** Volumen por unidad, en m³. */
  volumeM3: number;
  flags: readonly ItemFlag[];
};

/**
 * Cantidad de cada objeto por división. Clave: `lineKey(división, objeto)`. Es la misma clave que usa la base de
 * datos para reconocer una línea al guardar: el mismo objeto en dos divisiones son dos líneas.
 */
export type Quantities = Readonly<Record<string, number>>;

export function lineKey(room: string, itemId: string): string {
  return `${room}:${itemId}`;
}

/** Inversa de `lineKey`. Los slugs no llevan ":", así que el primero separa división y objeto. */
export function splitLineKey(key: string): { room: string; itemId: string } {
  const at = key.indexOf(":");
  return { room: key.slice(0, at), itemId: key.slice(at + 1) };
}

/** Pasos del editor, en orden. */
export const INVENTORY_STEPS = ["items", "access", "extras"] as const;
export type InventoryStep = (typeof INVENTORY_STEPS)[number];

export const LIFT_SIZES = ["none", "small", "normal"] as const;
export type LiftSize = (typeof LIFT_SIZES)[number];

/** Condiciones de acceso de un punto del recorrido (origen, parada o destino). Texto tal cual lo escribe la persona. */
export type AccessPoint = {
  floor: string;
  /** Distancia de estacionamiento, en metros (texto del campo). */
  parkingMeters: string;
  lift: LiftSize | null;
  narrowStairs: boolean;
  needsParkingPermit: boolean;
  notes: string;
};

/** Punto del recorrido que lleva sus propios accesos: origen, cada parada o destino. */
export type RoutePoint = {
  /** "origin", "stop-1", "stop-2"... o "destination". Sirve de clave y de prefijo de los campos. */
  id: string;
  /** Hueco del pedido en la base de datos (`addresses.id`): es lo que se guarda. */
  addressId: string;
  role: "origin" | "stop" | "destination";
  /** Número de la parada (1, 2, 3). `null` en origen y destino. */
  stopNumber: number | null;
  place: string;
};

export const EMPTY_ACCESS: AccessPoint = {
  floor: "",
  parkingMeters: "",
  lift: null,
  narrowStairs: false,
  needsParkingPermit: false,
  notes: "",
};

/** Límites de los accesos: los mismos `check` que `inventory_addresses`. */
export const ACCESS_LIMITS = { floorMin: -5, floorMax: 99, parkingMax: 10_000, notesMax: 1000 } as const;

/** Un punto tiene los accesos obligatorios (RF-23): piso, estacionamiento y ascensor. */
export function isAccessComplete(access: AccessPoint): boolean {
  const floor = Number(access.floor.trim());
  const parking = Number(access.parkingMeters.trim());
  return (
    access.floor.trim() !== "" &&
    Number.isInteger(floor) &&
    floor >= ACCESS_LIMITS.floorMin &&
    floor <= ACCESS_LIMITS.floorMax &&
    access.parkingMeters.trim() !== "" &&
    Number.isInteger(parking) &&
    parking >= 0 &&
    parking <= ACCESS_LIMITS.parkingMax &&
    access.lift !== null
  );
}

/**
 * Tipo de servicio extra del catálogo de Mudaro (`catalog_extras`, RF-24). Nombre y descripción llegan ya en el
 * idioma de la interfaz. Sin precio ni cantidad: es una referencia para las empresas, y cada una pone su servicio,
 * la cantidad y el precio en el presupuesto.
 */
export type ExtraType = {
  /** Id del catálogo (uuid). */
  id: string;
  name: string;
  description: string | null;
};

/** Extras marcados: id del tipo → nota opcional para las empresas ("" = sin nota). */
export type ChosenExtras = Readonly<Record<string, string>>;

/** Límite de la nota de un extra: el mismo `check` que `inventory_extras.note`. */
export const EXTRA_NOTE_MAX = 500;

/** Lo que el editor guarda en el borrador. */
export type InventoryDraft = {
  quantities: Quantities;
  /** Accesos por punto del recorrido (clave: `RoutePoint.id`). */
  access: Readonly<Record<string, AccessPoint>>;
  extras: ChosenExtras;
};

/** Estado del inventario de un pedido al abrir la pantalla. */
export type InventoryEditorData =
  | { kind: "draft"; version: number; points: readonly RoutePoint[]; draft: InventoryDraft }
  /** No hay borrador: la última versión ya se envió. Editarla abre una versión nueva (RF-27). */
  | { kind: "submitted"; version: number; submittedAt: string };

/**
 * Lo que se guarda en el borrador, ya validado. Cada sección es opcional: sin ella, esa parte no se toca.
 * `lines` y `extras` son el estado completo: lo que no viene se quita del borrador.
 */
export type DraftChanges = {
  lines?: readonly { catalogItemId: string; room: string; quantity: number }[];
  addresses?: readonly {
    addressId: string;
    floor: number;
    lift: LiftSize;
    narrowStairs: boolean;
    parkingMeters: number;
    needsParkingPermit: boolean;
    notes: string;
  }[];
  extras?: readonly { catalogExtraId: string; note: string }[];
};

/** Por qué no se pudo guardar o enviar. Códigos: la interfaz los traduce. */
export const INVENTORY_ERRORS = ["accessIncomplete", "empty", "notAllowed", "noDraft", "invalid", "failed"] as const;
export type InventoryError = (typeof INVENTORY_ERRORS)[number];

export type InventoryResult = { ok: true } | { ok: false; error: InventoryError };

export type InventorySummary = {
  volumeM3: number;
  items: number;
  fragile: number;
  dismantle: number;
};

/** Totales declarados, antes del factor de estiba. */
export function summarize(catalog: readonly CatalogItem[], quantities: Quantities): InventorySummary {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const total: InventorySummary = { volumeM3: 0, items: 0, fragile: 0, dismantle: 0 };
  for (const [key, quantity] of Object.entries(quantities)) {
    const item = byId.get(splitLineKey(key).itemId);
    if (!item || quantity <= 0) continue;
    total.items += quantity;
    total.volumeM3 += quantity * item.volumeM3;
    if (item.flags.includes("fragile")) total.fragile += quantity;
    if (item.flags.includes("dismantle")) total.dismantle += quantity;
  }
  return total;
}

/** Objetos de una división que ya llevan cantidad. */
export function countInRoom(quantities: Quantities, room: string): number {
  let count = 0;
  for (const [key, quantity] of Object.entries(quantities)) {
    if (splitLineKey(key).room === room) count += quantity;
  }
  return count;
}

/** Quita acentos y mayúsculas para comparar texto: "Sofá" y "sofa" coinciden. */
export function normalizeSearch(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase().trim();
}
