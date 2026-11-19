import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";
import type { Database } from "@mudaro/supabase";

import type { LiftSize } from "@/features/inventory/domain/types";
import { getRoomNames, itemFlagOf } from "@/features/inventory/infrastructure/inventory.repo";
import type {
  DetailAddress,
  DetailInventory,
  DetailLink,
  DetailNote,
  InventoryLine,
  InventoryRoom,
  OrderDetail,
  OrderEvent,
} from "../domain/detail";
import { buildOrdersMetrics } from "../domain/metrics";
import { formatOrderNumber, parseOrderNumber } from "../domain/order-number";
import {
  LINK_VALIDITY_DAYS,
  SOURCES,
  type ClientSuggestion,
  type Flexibility,
  type InventoryMode,
  type NewOrder,
  type Order,
  type OrderListItem,
  type OrderNote,
  type OrderStage,
  type OrderStatus,
  type OrdersOverview,
  type Source,
} from "../domain/types";

// Única puerta de entrada a los datos de pedidos: páginas y acciones importan de aquí.
// RLS: una empresa lee un pedido si tiene un envío en él y es administrador (RNF-01). El número visible
// (MD-0836) es `shipments.number`, la secuencia propia de cada empresa. Las escrituras pasan por `create_order()`.
//
// Inventario: se muestra la versión vigente, la última enviada (A11). Un borrador no se muestra hasta enviarse.
// Pendiente: el enlace con token se genera en la base de datos (share_order_link) pero la app aún no lo llama.
// Los envíos cancelados no se muestran: la pantalla de cancelar (RF-69) llega más adelante.

type ShipmentStatus = Database["public"]["Enums"]["shipment_status"];
type DateFlexibility = Database["public"]["Enums"]["date_flexibility"];

// Un solo literal por consulta: el cliente de Supabase deduce el tipo de las filas del texto del select.
const ORDER_ROUTE =
  "addresses(id, role, sort_order), inventories(version, filled_by, submitted_at, inventory_addresses(address_id, address), inventory_lines(quantity, unit_volume_m3))";

const LIST_SELECT = `number, status, lost_reason, status_changed_at, last_activity_at, created_at,
  client:clients(name),
  order:orders!inner(contact_name, desired_date, date_flexibility, link_validity_days, token_expires_at, ${ORDER_ROUTE})`;

const DETAIL_SELECT = `id, number, status, lost_reason, status_changed_at, created_at,
  client:clients(name, type, phone, email),
  order:orders!inner(
    contact_name, contact_source, desired_date, date_flexibility, link_validity_days, token_expires_at, created_at,
    addresses(id, role, sort_order),
    inventories(
      version, filled_by, submitted_at,
      inventory_addresses(address_id, address, floor, lift, narrow_stairs, parking_distance_m, needs_permit, notes),
      inventory_lines(description, room, quantity, unit_volume_m3, handling_flags, photos, created_at,
        catalog_item:catalog_items(sort_order, translations:catalog_item_translations(locale, name))),
      inventory_extras(catalog_extra:catalog_extras(sort_order, translations:catalog_extra_translations(locale, name)))
    )
  ),
  shipment_notes(body, created_at, author:company_users(name)),
  events:shipment_events(kind, occurred_at, actor_type, data)`;

// --- Traducciones entre la base de datos y el dominio ---

const FLEXIBILITY_FROM_DB: Record<DateFlexibility, Flexibility> = {
  exact: "exact",
  two_days: "two-days",
  one_week: "one-week",
  month: "month",
};

const FLEXIBILITY_TO_DB: Record<Flexibility, DateFlexibility> = {
  exact: "exact",
  "two-days": "two_days",
  "one-week": "one_week",
  month: "month",
};

/** Estado de la base de datos al del dominio. Un envío cancelado no tiene equivalente: no se muestra. */
function stageOf(status: ShipmentStatus): OrderStage | null {
  switch (status) {
    case "new":
      return "new";
    case "awaiting_inventory":
      return "awaiting-inventory";
    case "inventory_received":
      return "inventory-received";
    case "quoted":
      return "quoted";
    case "won":
      return "won";
    case "lost":
      return "lost";
    case "cancelled":
      return null;
  }
}

/** `Order.status` no tiene "perdido": un pedido perdido se queda en el último paso que alcanzó, como en el percurso. */
function statusOf(stage: OrderStage): OrderStatus {
  return stage === "lost" ? "quoted" : stage;
}

/** El ascensor de la base de datos se llama `large` y el del dominio `normal`. */
function liftOf(lift: Database["public"]["Enums"]["lift_size"]): LiftSize {
  return lift === "large" ? "normal" : lift;
}

/** El contacto se guarda como texto: solo se aceptan los códigos conocidos. */
function sourceOf(value: string | null): Source | null {
  return SOURCES.find((source) => source === value) ?? null;
}

/** aaaa-mm-dd de Lisboa a partir de un instante. */
function lisbonDay(instant: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon" }).format(new Date(instant));
}

/** Suma días a un aaaa-mm-dd. */
function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

// --- Dirección e inventario del pedido ---

type RouteRow = {
  addresses: { id: string; role: Database["public"]["Enums"]["address_role"]; sort_order: number }[];
  inventories: {
    version: number;
    filled_by: Database["public"]["Enums"]["filled_by"];
    submitted_at: string | null;
    inventory_addresses: { address_id: string; address: string }[];
    inventory_lines: { quantity: number; unit_volume_m3: number | null }[];
  }[];
};

/** Quién rellena el inventario: se decide al crear el pedido y queda en su versión 1. */
function inventoryModeOf(order: RouteRow): InventoryMode {
  const first = [...order.inventories].sort((a, b) => a.version - b.version)[0];
  return first?.filled_by === "company" ? "self" : "link";
}

/**
 * Versión vigente del inventario (A11): la última enviada. Sin ninguna enviada, el borrador de la versión 1, que es
 * donde está el texto de las direcciones del pedido recién creado.
 */
function currentInventory<T extends { version: number; submitted_at: string | null }>(inventories: readonly T[]): T | undefined {
  const sorted = [...inventories].sort((a, b) => b.version - a.version);
  return sorted.find((inventory) => inventory.submitted_at !== null) ?? sorted.at(-1);
}

/** Objetos y volumen declarados de una versión. Las líneas sin volumen (objeto libre sin medidas) no suman. */
function linesTotals(lines: readonly { quantity: number; unit_volume_m3: number | null }[]) {
  return lines.reduce(
    (total, line) => ({
      items: total.items + line.quantity,
      volumeM3: total.volumeM3 + (line.unit_volume_m3 === null ? 0 : line.quantity * Number(line.unit_volume_m3)),
    }),
    { items: 0, volumeM3: 0 },
  );
}

/** Origen, paradas y destino con el texto de la versión actual. */
function routeOf(order: RouteRow) {
  const inventory = currentInventory(order.inventories);
  const text = new Map((inventory?.inventory_addresses ?? []).map((row) => [row.address_id, row.address]));
  const sorted = [...order.addresses].sort((a, b) => a.sort_order - b.sort_order);
  const place = (role: "origin" | "destination") => text.get(sorted.find((address) => address.role === role)?.id ?? "") ?? "";
  return {
    origin: place("origin"),
    destination: place("destination"),
    stops: sorted.filter((address) => address.role === "stop").map((address) => text.get(address.id) ?? ""),
  };
}

// --- Lista ---

/** Nota de la fila de la lista. Los estados que aún no se alcanzan (4b y paso 5) llevan lo mínimo. */
function noteOf(
  stage: OrderStage,
  row: {
    mode: InventoryMode;
    changedAt: string;
    tokenExpiresAt: string | null;
    lostReason: string | null;
    totals: { items: number; volumeM3: number };
  },
): OrderNote {
  switch (stage) {
    case "new":
      return { kind: row.mode === "link" ? "just-created" : "just-created-self" };
    case "awaiting-inventory":
      // Sin enlace con token (la app aún no lo genera) no hay validez que mostrar.
      return row.tokenExpiresAt ? { kind: "filling", validUntil: lisbonDay(row.tokenExpiresAt) } : { kind: "just-created" };
    case "inventory-received":
      return { kind: "inventory-ready", receivedAt: row.changedAt, ...row.totals };
    case "quoted":
      // TODO(paso 5): la versión y la validez salen de `quotes`.
      return { kind: "proposal-sent", version: 1, validUntil: lisbonDay(row.changedAt) };
    case "won":
      return { kind: "won", signedAt: row.changedAt };
    case "lost":
      return { kind: "lost", reason: row.lostReason };
  }
}

/** Pedidos de la empresa de la sesión y las cifras del mes. */
export async function getOrdersOverview(): Promise<OrdersOverview> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shipments")
    .select(LIST_SELECT)
    .neq("status", "cancelled")
    .order("last_activity_at", { ascending: false });
  if (error) throw new Error(`orders: no se pudieron leer los pedidos (${error.code})`);

  const orders: OrderListItem[] = [];
  const counted: Parameters<typeof buildOrdersMetrics>[0][number][] = [];

  for (const row of data) {
    const stage = stageOf(row.status);
    if (!stage) continue;
    const route = routeOf(row.order);
    const mode = inventoryModeOf(row.order);

    orders.push({
      id: formatOrderNumber(row.number),
      client: row.client?.name ?? row.order.contact_name,
      from: route.origin,
      to: route.destination,
      stopCount: route.stops.length,
      date: row.order.desired_date,
      flexibility: FLEXIBILITY_FROM_DB[row.order.date_flexibility],
      stage,
      note: noteOf(stage, {
        mode,
        changedAt: row.status_changed_at,
        tokenExpiresAt: row.order.token_expires_at,
        lostReason: row.lost_reason,
        totals: linesTotals(currentInventory(row.order.inventories)?.inventory_lines ?? []),
      }),
      lastActivityAt: row.last_activity_at,
    });
    counted.push({ status: stage, createdAt: row.created_at, statusChangedAt: row.status_changed_at });
  }

  return { orders, metrics: buildOrdersMetrics(counted, new Date()) };
}

// --- Un pedido ---

/** El pedido, o undefined si no existe o no es de esta empresa (RLS). */
export async function getOrder(id: string): Promise<Order | undefined> {
  const number = parseOrderNumber(id);
  if (number === null) return undefined;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shipments")
    .select(LIST_SELECT)
    .eq("number", number)
    .neq("status", "cancelled")
    .maybeSingle();
  if (error) throw new Error(`orders: no se pudo leer el pedido (${error.code})`);
  if (!data) return undefined;

  const stage = stageOf(data.status);
  if (!stage) return undefined;
  const route = routeOf(data.order);
  // La base acepta de 1 a 90 días; la app solo ofrece las validez de LINK_VALIDITY_DAYS.
  const validityDays = LINK_VALIDITY_DAYS.find((days) => days === data.order.link_validity_days) ?? null;

  return {
    id: formatOrderNumber(data.number),
    clientName: data.client?.name ?? data.order.contact_name,
    origin: route.origin,
    destination: route.destination,
    stops: route.stops,
    date: data.order.desired_date,
    flexibility: FLEXIBILITY_FROM_DB[data.order.date_flexibility],
    inventoryMode: inventoryModeOf(data.order),
    status: statusOf(stage),
    // TODO(4b): sin enlace con token, la validez se calcula desde la creación. Con enlace, sale de `token_expires_at`.
    linkValidityDays: validityDays,
    linkValidUntil: data.order.token_expires_at
      ? lisbonDay(data.order.token_expires_at)
      : validityDays
        ? addDays(lisbonDay(data.created_at), validityDays)
        : null,
  };
}

/** Evento del historial. Los datos del evento son JSON: solo se leen los campos que se conocen. */
function eventOf(
  row: { kind: Database["public"]["Enums"]["shipment_event_kind"]; occurred_at: string; actor_type: string; data: unknown },
  source: Source | null,
): OrderEvent | null {
  const data = (typeof row.data === "object" && row.data !== null ? row.data : {}) as {
    by?: string;
    linkValidityDays?: number | null;
    version?: number;
    reason?: string | null;
  };
  const actor = data.by ?? "";
  const at = row.occurred_at;

  switch (row.kind) {
    case "created":
      return { kind: "created", at, actor, source };
    case "note_added":
      return { kind: "note-added", at, actor };
    case "link_shared":
    case "link_resent":
      return { kind: "link-shared", at, actor, validityDays: data.linkValidityDays ?? 0 };
    case "inventory_submitted":
      return {
        kind: "inventory-submitted",
        at,
        version: data.version ?? 1,
        by: row.actor_type === "company" ? "company" : "client",
        actor,
      };
    case "quote_sent":
      return { kind: "proposal-sent", at, actor, version: data.version ?? 1 };
    case "won":
      return { kind: "won", at };
    case "lost":
      return { kind: "lost", at, reason: data.reason ?? null };
    case "cancelled":
      // La cancelación (RF-69) aún no tiene pantalla: sus pedidos no se muestran.
      return null;
  }
}

type AppLocale = Database["public"]["Enums"]["app_locale"];

/** Texto en el idioma pedido o, si falta, en portugués (obligatorio en el catálogo). */
function translated(rows: readonly { locale: AppLocale; name: string }[], locale: AppLocale): string {
  return (rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === "pt"))?.name ?? "";
}

type DetailLineRow = {
  description: string | null;
  room: string | null;
  quantity: number;
  unit_volume_m3: number | null;
  handling_flags: Database["public"]["Enums"]["handling_flag"][];
  photos: string[];
  created_at: string;
  catalog_item: { sort_order: number; translations: { locale: AppLocale; name: string }[] } | null;
};

/** Líneas de la versión agrupadas por división, en el orden del catálogo; las líneas sin división, al final. */
function roomsOf(lines: readonly DetailLineRow[], roomNames: ReadonlyMap<string, string>, locale: AppLocale): InventoryRoom[] {
  const order = [...roomNames.keys()];
  const position = (slug: string) => (order.includes(slug) ? order.indexOf(slug) : order.length);
  const groups = new Map<string, InventoryLine[]>();
  const sorted = [...lines].sort(
    (a, b) => (a.catalog_item?.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.catalog_item?.sort_order ?? Number.MAX_SAFE_INTEGER) || a.created_at.localeCompare(b.created_at),
  );
  for (const line of sorted) {
    const slug = line.room ?? "";
    const list = groups.get(slug) ?? [];
    list.push({
      quantity: line.quantity,
      name: line.catalog_item ? translated(line.catalog_item.translations, locale) : (line.description ?? ""),
      volumeM3: line.unit_volume_m3 === null ? null : line.quantity * Number(line.unit_volume_m3),
      flags: line.handling_flags.map(itemFlagOf),
      free: line.catalog_item === null,
      hasPhoto: line.photos.length > 0,
    });
    groups.set(slug, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => position(a) - position(b))
    .map(([slug, roomLines]) => ({ slug, name: roomNames.get(slug) ?? "", lines: roomLines }));
}

/** Detalle completo de un pedido de la empresa de la sesión, o undefined si no existe o no es suyo (RLS). */
export async function getOrderDetail(id: string, locale: AppLocale): Promise<OrderDetail | undefined> {
  const number = parseOrderNumber(id);
  if (number === null) return undefined;

  const supabase = await createSupabaseServerClient();
  const [{ data, error }, roomNames] = await Promise.all([
    supabase
      .from("shipments")
      .select(DETAIL_SELECT)
      .eq("number", number)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false, referencedTable: "shipment_notes" })
      .limit(1, { referencedTable: "shipment_notes" })
      .maybeSingle(),
    getRoomNames(locale),
  ]);
  if (error) throw new Error(`orders: no se pudo leer el detalle del pedido (${error.code})`);
  if (!data) return undefined;

  const stage = stageOf(data.status);
  if (!stage) return undefined;

  const order = data.order;
  const source = sourceOf(order.contact_source);
  const inventory = currentInventory(order.inventories);
  const sorted = [...order.addresses].sort((a, b) => a.sort_order - b.sort_order);

  // Los accesos de una versión en borrador no están confirmados (son obligatorios al enviar, RF-23): no se muestran.
  const addressOf = (slot: { id: string } | undefined, role: DetailAddress["role"], stopNumber: number | null): DetailAddress => {
    const row = inventory?.inventory_addresses.find((candidate) => candidate.address_id === slot?.id);
    return {
      role,
      stopNumber,
      place: row?.address ?? "",
      access:
        row && inventory?.submitted_at
          ? {
              floor: row.floor,
              lift: liftOf(row.lift),
              narrowStairs: row.narrow_stairs,
              parkingMeters: row.parking_distance_m,
              needsParkingPermit: row.needs_permit,
            }
          : null,
      clientNote: row?.notes ?? null,
    };
  };
  const slotsOf = (role: DetailAddress["role"]) => sorted.filter((address) => address.role === role);

  const events = data.events
    .map((row) => eventOf(row, source))
    .filter((event): event is OrderEvent => event !== null)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  const newest = data.shipment_notes[0];
  const note: DetailNote | null = newest ? { text: newest.body, author: newest.author?.name ?? "", at: newest.created_at } : null;

  // El enlace solo existe cuando hay token. Hasta entonces el panel del enlace no se muestra.
  const link: DetailLink | null = order.token_expires_at
    ? {
        createdAt: events.findLast((event) => event.kind === "link-shared")?.at ?? order.created_at,
        validUntil: lisbonDay(order.token_expires_at),
        validityDays: order.link_validity_days ?? 0,
      }
    : null;

  return {
    id: formatOrderNumber(data.number),
    client: {
      name: data.client?.name ?? order.contact_name,
      type: data.client?.type ?? "private",
      phone: data.client?.phone ?? null,
      email: data.client?.email ?? null,
    },
    source,
    createdAt: data.created_at,
    stage,
    inventoryMode: inventoryModeOf(order),
    date: order.desired_date,
    flexibility: FLEXIBILITY_FROM_DB[order.date_flexibility],
    // TODO(paso 5): los km se calculan al hacer el presupuesto.
    distanceKm: null,
    origin: addressOf(slotsOf("origin")[0], "origin", null),
    stops: slotsOf("stop").map((slot, index) => addressOf(slot, "stop", index + 1)),
    destination: addressOf(slotsOf("destination")[0], "destination", null),
    inventory: inventoryOf(inventory, roomNames, locale),
    link,
    note,
    // TODO(paso 5): sale de `quotes`.
    proposalCount: 0,
    events,
  };
}

/** Inventario de la versión vigente. Mientras no haya ninguna versión enviada, no hay inventario que mostrar. */
function inventoryOf(
  inventory:
    | {
        version: number;
        filled_by: Database["public"]["Enums"]["filled_by"];
        submitted_at: string | null;
        inventory_lines: DetailLineRow[];
        inventory_extras: { catalog_extra: { sort_order: number; translations: { locale: AppLocale; name: string }[] } | null }[];
      }
    | undefined,
  roomNames: ReadonlyMap<string, string>,
  locale: AppLocale,
): DetailInventory | null {
  if (!inventory?.submitted_at) return null;
  return {
    version: inventory.version,
    filledBy: inventory.filled_by === "company" ? "self" : "link",
    submittedAt: inventory.submitted_at,
    rooms: roomsOf(inventory.inventory_lines, roomNames, locale),
    photoCount: inventory.inventory_lines.reduce((sum, line) => sum + line.photos.length, 0),
    extras: inventory.inventory_extras
      .flatMap((row) => (row.catalog_extra ? [row.catalog_extra] : []))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((extra) => translated(extra.translations, locale)),
  };
}

// --- Clientes ---

/** Cliente de la empresa con ese teléfono (normalizado: +351XXXXXXXXX), para reutilizar su ficha (RF-14). */
export async function findClientByPhone(phone: string): Promise<ClientSuggestion | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, type, email, shipments(number, status, status_changed_at)")
    .eq("phone", phone)
    .maybeSingle();
  if (error) throw new Error(`orders: no se pudo buscar el cliente (${error.code})`);
  if (!data) return null;

  const counted = data.shipments.filter((shipment) => shipment.status !== "cancelled");
  const lastWon = counted
    .filter((shipment) => shipment.status === "won")
    .sort((a, b) => Date.parse(b.status_changed_at) - Date.parse(a.status_changed_at))[0];

  // El teléfono no sale de esta capa: la sugerencia solo lleva lo que la interfaz necesita
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    email: data.email,
    orderCount: counted.length,
    lastOrder: lastWon ? { id: formatOrderNumber(lastWon.number), completedOn: lisbonDay(lastWon.status_changed_at) } : null,
  };
}

// --- Alta ---

/**
 * Crea el pedido con `create_order()`: ficha del cliente (la reutiliza por teléfono), pedido, envío y la versión 1
 * del inventario en borrador, todo en una transacción. La función valida sesión y rol en la base de datos.
 * El enlace del cliente no se genera aquí (paso 4b).
 */
export async function createOrder(input: NewOrder): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_order", {
    // El generador de tipos marca todos los argumentos como no nulos, pero la función acepta null en estos dos.
    p_client_id: input.clientId as string,
    p_link_validity_days: input.linkValidityDays as number,
    p_client_name: input.name,
    p_client_phone: input.phone,
    p_client_type: input.clientType,
    p_client_email: input.email ?? "",
    p_client_tax_id: input.taxId ?? "",
    p_origin: input.origin,
    p_destination: input.destination,
    p_stops: [...input.stops],
    p_desired_date: input.date,
    p_date_flexibility: FLEXIBILITY_TO_DB[input.flexibility],
    p_contact_source: input.source ?? "",
    p_filled_by: input.inventoryMode === "link" ? "client" : "company",
  });

  if (error || data === null) throw new Error(`orders: no se pudo crear el pedido (${error?.code ?? "sin número"})`);
  return { id: formatOrderNumber(data) };
}
