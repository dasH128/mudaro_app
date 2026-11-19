import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";
import type { Database } from "@mudaro/supabase";

import { parseOrderNumber } from "@/features/orders/domain/order-number";
import {
  EMPTY_ACCESS,
  lineKey,
  type AccessPoint,
  type CatalogItem,
  type CatalogRoom,
  type DraftChanges,
  type ExtraType,
  type InventoryEditorData,
  type InventoryError,
  type InventoryResult,
  type ItemFlag,
  type LiftSize,
  type RoutePoint,
} from "../domain/types";

// Única puerta de entrada a los datos del inventario: páginas y acciones importan de aquí.
// Lecturas con RLS: el catálogo lo leen todas las empresas y el inventario, la empresa con envío en el pedido.
// Escrituras por funciones de la base de datos (save_inventory_draft, submit_inventory, open_inventory_draft),
// que vuelven a comprobar sesión, rol y que el pedido es de la empresa (RNF-01).

type AppLocale = Database["public"]["Enums"]["app_locale"];
type DbLift = Database["public"]["Enums"]["lift_size"];
type DbFlag = Database["public"]["Enums"]["handling_flag"];

/** El portugués es obligatorio en el catálogo: es el respaldo si falta una traducción. */
const FALLBACK_LOCALE: AppLocale = "pt";

/** Texto en el idioma pedido o, si falta, en portugués. */
function pick<T extends { locale: AppLocale }>(rows: readonly T[], locale: AppLocale): T | undefined {
  return rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === FALLBACK_LOCALE);
}

// --- Traducciones entre la base de datos y el dominio ---

const FLAG_FROM_DB: Record<DbFlag, ItemFlag> = { fragile: "fragile", disassembly: "dismantle", extra_crew: "extra-crew" };

/** Marca de manipulación de la base de datos a la del dominio. La usa también el detalle del pedido. */
export function itemFlagOf(flag: DbFlag): ItemFlag {
  return FLAG_FROM_DB[flag];
}

/**
 * Nombre de cada división del catálogo en el idioma pedido, por slug. La RLS solo deja ver las activas: una línea
 * de una división desactivada después sale sin nombre.
 */
export async function getRoomNames(locale: AppLocale): Promise<ReadonlyMap<string, string>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("catalog_rooms").select("slug, translations:catalog_room_translations(locale, name)");
  if (error) throw new Error(`inventory: no se pudieron leer las divisiones (${error.code})`);
  return new Map(data.flatMap((row) => {
    const text = pick(row.translations, locale);
    return text ? [[row.slug, text.name] as const] : [];
  }));
}

/** El ascensor de la base de datos se llama `large` y el del dominio `normal`. */
const LIFT_FROM_DB: Record<DbLift, LiftSize> = { none: "none", small: "small", large: "normal" };
const LIFT_TO_DB: Record<LiftSize, DbLift> = { none: "none", small: "small", normal: "large" };

/** Código de error de las funciones de la base de datos al del dominio. */
function errorOf(message: string | undefined): InventoryError {
  switch (message) {
    case "not allowed":
    case "order cancelled":
      return "notAllowed";
    case "no draft inventory":
    case "a submitted inventory version cannot change":
      return "noDraft";
    case "empty inventory":
      return "empty";
    case "missing address":
      return "accessIncomplete";
    case "invalid payload":
    case "invalid line":
    case "duplicated line":
    case "duplicated extra":
    case "catalog item not found":
    case "catalog extra not found":
    case "address not found":
      return "invalid";
    default:
      return "failed";
  }
}

// --- Catálogo ---

/** Divisiones y objetos activos del catálogo de Mudaro, por orden, con los nombres en el idioma pedido (RF-10). */
export async function getCatalog(locale: AppLocale): Promise<{ rooms: CatalogRoom[]; items: CatalogItem[] }> {
  const supabase = await createSupabaseServerClient();
  const [rooms, items] = await Promise.all([
    supabase
      .from("catalog_rooms")
      .select("slug, translations:catalog_room_translations(locale, name)")
      .eq("active", true)
      .order("sort_order")
      .order("slug"),
    supabase
      .from("catalog_items")
      .select(
        "id, volume_m3, handling_flags, translations:catalog_item_translations(locale, name), rooms:catalog_item_rooms(room:catalog_rooms(slug))",
      )
      .eq("active", true)
      .order("sort_order")
      .order("slug"),
  ]);
  if (rooms.error) throw new Error(`inventory: no se pudieron leer las divisiones (${rooms.error.code})`);
  if (items.error) throw new Error(`inventory: no se pudo leer el catálogo (${items.error.code})`);

  return {
    // Sin portugués no hay nombre que mostrar: el panel interno lo exige al crear la división o el objeto
    rooms: rooms.data.flatMap((row) => {
      const text = pick(row.translations, locale);
      return text ? [{ slug: row.slug, name: text.name }] : [];
    }),
    items: items.data.flatMap((row) => {
      const text = pick(row.translations, locale);
      if (!text) return [];
      return [
        {
          id: row.id,
          rooms: row.rooms.flatMap((link) => (link.room ? [link.room.slug] : [])),
          name: text.name,
          volumeM3: Number(row.volume_m3),
          flags: row.handling_flags.map((flag) => FLAG_FROM_DB[flag]),
        },
      ];
    }),
  };
}

/**
 * Tipos de servicio extra del catálogo de Mudaro, activos y por orden (RF-24), con nombre y descripción en el
 * idioma pedido. La RLS ya oculta los inactivos a las empresas; el filtro lo deja explícito.
 */
export async function getExtraTypes(locale: AppLocale): Promise<readonly ExtraType[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("catalog_extras")
    .select("id, translations:catalog_extra_translations(locale, name, description)")
    .eq("active", true)
    .order("sort_order")
    .order("slug");
  if (error) throw new Error(`inventory: no se pudieron leer los tipos de extra (${error.code})`);

  return data.flatMap((row) => {
    const text = pick(row.translations, locale);
    return text ? [{ id: row.id, name: text.name, description: text.description }] : [];
  });
}

// --- Inventario de un pedido ---

const EDITOR_SELECT = `order_id,
  order:orders!inner(
    addresses(id, role, sort_order),
    inventories(
      version, submitted_at,
      inventory_addresses(address_id, address, floor, lift, narrow_stairs, parking_distance_m, needs_permit, notes),
      inventory_lines(catalog_item_id, room, quantity),
      inventory_extras(catalog_extra_id, note)
    )
  )`;

type DbAccess = {
  floor: number;
  lift: DbLift;
  narrow_stairs: boolean;
  parking_distance_m: number;
  needs_permit: boolean;
  notes: string | null;
};

/**
 * Accesos guardados de una dirección. La base de datos guarda valores por defecto (rés-do-chão, sem elevador, 0 m)
 * que no se distinguen de una respuesta: en la versión 1, si todo sigue en el valor por defecto, se muestran vacíos
 * para que la persona los rellene (RF-23). En una versión nueva vienen de una versión enviada y son respuestas.
 */
function accessOf(row: DbAccess, version: number): AccessPoint {
  const untouched =
    row.floor === 0 && row.lift === "none" && !row.narrow_stairs && row.parking_distance_m === 0 && !row.needs_permit && !row.notes;
  if (version === 1 && untouched) return EMPTY_ACCESS;
  return {
    floor: String(row.floor),
    parkingMeters: String(row.parking_distance_m),
    lift: LIFT_FROM_DB[row.lift],
    narrowStairs: row.narrow_stairs,
    needsParkingPermit: row.needs_permit,
    notes: row.notes ?? "",
  };
}

/** Id del pedido (uuid) a partir del número visible. RLS: solo si la empresa tiene un envío en él. */
async function orderIdOf(orderNumber: string): Promise<string | undefined> {
  const number = parseOrderNumber(orderNumber);
  if (number === null) return undefined;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shipments")
    .select("order_id")
    .eq("number", number)
    .neq("status", "cancelled")
    .maybeSingle();
  if (error) throw new Error(`inventory: no se pudo leer el pedido (${error.code})`);
  return data?.order_id;
}

/**
 * Lo que la pantalla Inventário necesita del pedido: el borrador con objetos, accesos y extras, o la última versión
 * enviada si no hay borrador. undefined si el pedido no existe o no es de esta empresa (RLS).
 */
export async function getInventoryEditor(orderNumber: string): Promise<InventoryEditorData | undefined> {
  const number = parseOrderNumber(orderNumber);
  if (number === null) return undefined;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shipments")
    .select(EDITOR_SELECT)
    .eq("number", number)
    .neq("status", "cancelled")
    .maybeSingle();
  if (error) throw new Error(`inventory: no se pudo leer el inventario (${error.code})`);
  if (!data) return undefined;

  const inventories = [...data.order.inventories].sort((a, b) => b.version - a.version);
  const draft = inventories.find((inventory) => inventory.submitted_at === null);
  if (!draft) {
    const last = inventories[0];
    if (!last?.submitted_at) return undefined;
    return { kind: "submitted", version: last.version, submittedAt: last.submitted_at };
  }

  // create_order() numera los huecos en orden de recorrido: origen 0, paradas 1..n y destino al final.
  const sorted = [...data.order.addresses].sort((a, b) => a.sort_order - b.sort_order);
  const stops = sorted.filter((address) => address.role === "stop");
  const points: RoutePoint[] = sorted.map((address) => {
    const row = draft.inventory_addresses.find((candidate) => candidate.address_id === address.id);
    const stopNumber = address.role === "stop" ? stops.indexOf(address) + 1 : null;
    return {
      id: address.role === "stop" ? `stop-${stopNumber}` : address.role,
      addressId: address.id,
      role: address.role,
      stopNumber,
      place: row?.address ?? "",
    };
  });

  const access: Record<string, AccessPoint> = {};
  for (const point of points) {
    const row = draft.inventory_addresses.find((candidate) => candidate.address_id === point.addressId);
    if (row) access[point.id] = accessOf(row, draft.version);
  }

  // Solo los objetos del catálogo: la pantalla todavía no crea objetos libres.
  const quantities: Record<string, number> = {};
  for (const line of draft.inventory_lines) {
    if (line.catalog_item_id && line.room) quantities[lineKey(line.room, line.catalog_item_id)] = line.quantity;
  }

  const extras: Record<string, string> = {};
  for (const extra of draft.inventory_extras) extras[extra.catalog_extra_id] = extra.note ?? "";

  return { kind: "draft", version: draft.version, points, draft: { quantities, access, extras } };
}

/** Guarda en el borrador las secciones que vengan, en una transacción (`save_inventory_draft`). */
export async function saveInventoryDraft(orderNumber: string, changes: DraftChanges): Promise<InventoryResult> {
  const orderId = await orderIdOf(orderNumber);
  if (!orderId) return { ok: false, error: "notAllowed" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_inventory_draft", {
    p_order_id: orderId,
    p_lines: changes.lines ? changes.lines.map((line) => ({ ...line })) : null,
    p_addresses: changes.addresses
      ? changes.addresses.map((address) => ({
          addressId: address.addressId,
          floor: address.floor,
          lift: LIFT_TO_DB[address.lift],
          narrowStairs: address.narrowStairs,
          parkingDistanceM: address.parkingMeters,
          needsPermit: address.needsParkingPermit,
          notes: address.notes,
        }))
      : null,
    p_extras: changes.extras ? changes.extras.map((extra) => ({ ...extra })) : null,
  });
  return error ? { ok: false, error: errorOf(error.message) } : { ok: true };
}

/** Cierra la versión y pasa el envío a "Inventário recebido" (`submit_inventory`, RF-26). */
export async function submitInventory(orderNumber: string): Promise<InventoryResult> {
  const orderId = await orderIdOf(orderNumber);
  if (!orderId) return { ok: false, error: "notAllowed" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("submit_inventory", { p_order_id: orderId });
  return error ? { ok: false, error: errorOf(error.message) } : { ok: true };
}

/** Abre una versión nueva copiando la última enviada, o devuelve el borrador que ya hubiera (RF-27). */
export async function openInventoryDraft(orderNumber: string): Promise<InventoryResult> {
  const orderId = await orderIdOf(orderNumber);
  if (!orderId) return { ok: false, error: "notAllowed" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("open_inventory_draft", { p_order_id: orderId });
  return error ? { ok: false, error: errorOf(error.message) } : { ok: true };
}
