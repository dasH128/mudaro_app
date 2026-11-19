import "server-only";

import { cache } from "react";

import {
  EMPTY_ACCESS,
  lineKey,
  type AccessPoint,
  type DraftChanges,
  type ItemFlag,
  type LiftSize,
  type RoutePoint,
} from "@mudaro/inventory";

import type { Locale } from "@/app/i18n/config";
import type { ClientError, ClientOrder, ClientOrderView, ClientQuote, ClientResult } from "../domain/types";

// Única puerta de entrada a los datos del cliente. La web del cliente no habla con la base de datos: llama a la Edge
// Function `client-order`, que calcula el hash del token y solo trabaja con el pedido de ese enlace (RNF-02).
// Aquí se traduce su respuesta (nombres de la base de datos) a los tipos del dominio.

type DbLift = "none" | "small" | "large";
type DbFlag = "fragile" | "disassembly" | "extra_crew";

const LIFT_FROM_DB: Record<DbLift, LiftSize> = { none: "none", small: "small", large: "normal" };
const LIFT_TO_DB: Record<LiftSize, DbLift> = { none: "none", small: "small", normal: "large" };
const FLAG_FROM_DB: Record<DbFlag, ItemFlag> = { fragile: "fragile", disassembly: "dismantle", extra_crew: "extra-crew" };

type DbAccess = {
  address_id: string;
  address: string;
  floor: number;
  lift: DbLift;
  narrow_stairs: boolean;
  parking_distance_m: number;
  needs_permit: boolean;
  notes: string | null;
};

type GetResponse = {
  order: {
    companyName: string;
    contactName: string;
    desiredDate: string;
    expiresAt: string | null;
    expired: boolean;
    addresses: { id: string; role: "origin" | "stop" | "destination" }[];
  };
  draft: {
    version: number;
    addresses: DbAccess[];
    lines: { catalog_item_id: string | null; room: string | null; quantity: number }[];
    extras: { catalog_extra_id: string; note: string | null }[];
  } | null;
  submitted: { version: number; submittedAt: string } | null;
  quote: {
    id: string;
    status: ClientQuote["status"];
    expired: boolean;
    validUntil: string | null;
    documentHash: string;
    snapshot: {
      number: number;
      version: number;
      pricingMode: "fixed" | "hourly";
      hourlyRateCents: number | null;
      operatorCount: number | null;
      estimatedHours: number | null;
      vatPct: number;
      conditions: string | null;
      lines: ClientQuote["lines"];
      inventory: { version: number; lines: { catalogItemId: string | null; description: string | null; room: string | null; quantity: number }[] };
    };
    acceptance: ClientQuote["acceptance"];
  } | null;
  catalog: {
    rooms: { slug: string; name: string }[];
    items: { id: string; name: string; volumeM3: number; flags: DbFlag[]; rooms: string[] }[];
    extras: { id: string; name: string; description: string | null }[];
  };
};

function endpoint(): { url: string; key: string } {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key) throw new Error("client-order: faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return { url: `${base.replace(/\/+$/, "")}/functions/v1/client-order`, key };
}

async function call(body: Record<string, unknown>): Promise<{ status: number; data: unknown }> {
  const { url, key } = endpoint();
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  return { status: response.status, data };
}

function errorOf(data: unknown): ClientError {
  const code = typeof data === "object" && data !== null && "code" in data ? data.code : undefined;
  switch (code) {
    case "access_incomplete":
      return "accessIncomplete";
    case "empty":
      return "empty";
    case "expired":
      return "expired";
    case "not_found":
      return "notFound";
    case "no_draft":
      return "noDraft";
    case "invalid_input":
      return "invalid";
    case "quote_closed":
      return "quoteClosed";
    case "quote_expired":
      return "quoteExpired";
    case "document_changed":
      return "documentChanged";
    default:
      return "failed";
  }
}

/**
 * Accesos guardados. La base guarda valores por defecto (rés-do-chão, sem elevador, 0 m) que no se distinguen de una
 * respuesta: en la versión 1, si todo sigue en el valor por defecto, se muestran vacíos (RF-23), igual que en la app
 * de la empresa.
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

/** El pedido del enlace, o `null` si el enlace no existe, se sustituyó o el pedido se canceló. */
/**
 * Lee el pedido del enlace. Con `cache`, el título de la pestaña (generateMetadata) y la página comparten una sola
 * llamada a la Edge Function en cada petición.
 */
export const getClientOrder = cache(readClientOrder);

async function readClientOrder(token: string, locale: Locale): Promise<ClientOrderView | null> {
  const { status, data } = await call({ action: "get", token, locale });
  if (status === 404 || status === 400) return null;
  if (status !== 200 || !data) throw new Error(`client-order: no se pudo leer el pedido (${status})`);

  const response = data as GetResponse;
  const order: ClientOrder = {
    companyName: response.order.companyName,
    contactName: response.order.contactName,
    date: response.order.desiredDate,
    expiresAt: response.order.expiresAt,
  };

  const quote = quoteOf(response);
  const draft = response.draft;
  if (!draft) {
    if (!response.submitted) return null;
    return { kind: "submitted", order, quote, version: response.submitted.version, submittedAt: response.submitted.submittedAt };
  }
  if (response.order.expired) return { kind: "expired", order, quote };

  // La Edge Function devuelve los huecos en orden de recorrido: origen, paradas y destino.
  let stop = 0;
  const points: RoutePoint[] = response.order.addresses.map((address) => {
    const stopNumber = address.role === "stop" ? ++stop : null;
    return {
      id: address.role === "stop" ? `stop-${stopNumber}` : address.role,
      addressId: address.id,
      role: address.role,
      stopNumber,
      place: draft.addresses.find((row) => row.address_id === address.id)?.address ?? "",
    };
  });

  const access: Record<string, AccessPoint> = {};
  for (const point of points) {
    const row = draft.addresses.find((candidate) => candidate.address_id === point.addressId);
    if (row) access[point.id] = accessOf(row, draft.version);
  }

  // Solo los objetos del catálogo: los objetos libres no tienen pantalla todavía.
  const quantities: Record<string, number> = {};
  for (const line of draft.lines) {
    if (line.catalog_item_id && line.room) quantities[lineKey(line.room, line.catalog_item_id)] = line.quantity;
  }

  const extras: Record<string, string> = {};
  for (const extra of draft.extras) extras[extra.catalog_extra_id] = extra.note ?? "";

  return {
    kind: "draft",
    order,
    quote,
    version: draft.version,
    points,
    draft: { quantities, access, extras },
    rooms: response.catalog.rooms,
    catalog: response.catalog.items.map((item) => ({ ...item, flags: item.flags.map((flag) => FLAG_FROM_DB[flag]) })),
    extras: response.catalog.extras,
  };
}

/** El orçamento vigente, con los nombres del inventario anexo en el idioma de la interfaz (RF-39). */
function quoteOf(response: GetResponse): ClientQuote | null {
  const row = response.quote;
  if (!row) return null;
  const itemName = new Map(response.catalog.items.map((item) => [item.id, item.name]));
  const roomName = new Map(response.catalog.rooms.map((room) => [room.slug, room.name]));
  const snap = row.snapshot;
  return {
    id: row.id,
    status: row.status,
    expired: row.expired,
    validUntil: row.validUntil,
    documentHash: row.documentHash,
    number: snap.number,
    version: snap.version,
    pricingMode: snap.pricingMode,
    hourlyRateCents: snap.hourlyRateCents,
    operatorCount: snap.operatorCount,
    estimatedHours: snap.estimatedHours === null ? null : Number(snap.estimatedHours),
    vatPct: Number(snap.vatPct),
    conditions: snap.conditions,
    lines: snap.lines.map((line) => ({ ...line, quantity: Number(line.quantity) })),
    inventory: {
      version: snap.inventory.version,
      lines: snap.inventory.lines.map((line) => ({
        name: (line.catalogItemId ? itemName.get(line.catalogItemId) : null) ?? line.description ?? "—",
        room: (line.room ? roomName.get(line.room) : null) ?? "",
        quantity: line.quantity,
      })),
    },
    acceptance: row.acceptance,
  };
}

/** RF-43: aceptar con nombre y firma. La Edge Function guarda la firma y la base comprueba validez y huella. */
export async function acceptClientQuote(input: {
  token: string;
  quoteId: string;
  documentHash: string;
  selectedLineIds: readonly string[];
  signerName: string;
  signature: string;
  ip: string | null;
}): Promise<ClientResult> {
  const { status, data } = await call({ action: "accept", ...input });
  return status === 200 ? { ok: true } : { ok: false, error: errorOf(data) };
}

/** RF-44: rechazar con motivo opcional. */
export async function rejectClientQuote(input: { token: string; quoteId: string; reason: string }): Promise<ClientResult> {
  const { status, data } = await call({ action: "reject", ...input });
  return status === 200 ? { ok: true } : { ok: false, error: errorOf(data) };
}

function payloadOf(changes: DraftChanges) {
  return {
    lines: changes.lines ? changes.lines.map((line) => ({ ...line })) : null,
    addresses: changes.addresses
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
    extras: changes.extras ? changes.extras.map((extra) => ({ ...extra })) : null,
  };
}

/** Guarda en el borrador las secciones que vengan (client_save_inventory_draft). */
export async function saveClientDraft(token: string, changes: DraftChanges): Promise<ClientResult> {
  const { status, data } = await call({ action: "save", token, ...payloadOf(changes) });
  return status === 200 ? { ok: true } : { ok: false, error: errorOf(data) };
}

/** Guarda todo y envía la versión: el pedido pasa a "Inventário recebido" en la empresa (RF-26). */
export async function submitClientInventory(token: string, changes: DraftChanges): Promise<ClientResult> {
  const payload = payloadOf(changes);
  const { status, data } = await call({
    action: "submit",
    token,
    lines: payload.lines ?? [],
    addresses: payload.addresses ?? [],
    extras: payload.extras ?? [],
  });
  return status === 200 ? { ok: true } : { ok: false, error: errorOf(data) };
}
