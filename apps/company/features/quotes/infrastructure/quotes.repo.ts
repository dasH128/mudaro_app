import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";
import type { Database, Json } from "@mudaro/supabase";
import type { LiftSize } from "@mudaro/inventory";

import { itemFlagOf } from "@/features/inventory/infrastructure/inventory.repo";
import { formatOrderNumber, parseOrderNumber } from "@/features/orders/domain/order-number";
import { getCompanyExtras, getCurrentTariff } from "@/features/pricing/infrastructure/pricing.repo";
import type { EditorDraft, EditorLine, QuoteError, QuoteSaveResult } from "../domain/editor";
import type { QuoteEditorData } from "../domain/editor-data";
import type { Quote, QuoteMetrics, QuotesOverview, ReadyOrder } from "../domain/types";

// Única puerta de entrada a los datos de orçamentos (paso 5): las páginas importan de aquí. Lecturas con RLS: solo los
// administradores de la empresa leen sus orçamentos (RNF-01, RNF-03).

type Options = {
  /** Solo el administrador ve el margen (RNF-03). Con `false` el margen ni sale de esta capa. */
  includeMargin: boolean;
};

const LIST_SELECT = `number, version, status, volume_m3, estimated_cost_cents, vat_pct, valid_until, sent_at, created_at, rejected_reason,
  quote_lines(total_cents, optional),
  acceptances(accepted_at, signed_total_cents),
  inventory:inventories(inventory_addresses(address_id, address)),
  shipment:shipments!inner(number, created_at, client:clients(name), order:orders!inner(contact_name, addresses(id, role, sort_order)))`;

const READY_SELECT = `number, status_changed_at,
  client:clients(name),
  order:orders!inner(contact_name, addresses(id, role, sort_order),
    inventories(version, submitted_at, inventory_addresses(address_id, address), inventory_lines(quantity, unit_volume_m3))),
  quotes(status)`;

const DAY_MS = 86_400_000;
const ORC = (number: number) => `ORC-${String(number).padStart(4, "0")}`;

type Addressed = { addresses: { id: string; role: string; sort_order: number }[] };
type Texts = { address_id: string; address: string }[];

/** Origen y destino en texto, de la versión del inventario indicada. */
function endsOf(order: Addressed, texts: Texts): { from: string; to: string } {
  const sorted = [...order.addresses].sort((a, b) => a.sort_order - b.sort_order);
  const text = (role: string) => {
    const slot = role === "origin" ? sorted[0] : sorted[sorted.length - 1];
    return texts.find((row) => row.address_id === slot?.id)?.address ?? "";
  };
  return { from: text("origin"), to: text("destination") };
}

/** Orçamentos de la empresa de la sesión, los pedidos listos para orçamentar y los indicadores (RF-38, RF-42, RF-45). */
export async function getQuotesOverview({ includeMargin }: Options): Promise<QuotesOverview> {
  const supabase = await createSupabaseServerClient();
  const [quotesResult, readyResult] = await Promise.all([
    supabase.from("quotes").select(LIST_SELECT).order("created_at", { ascending: false }),
    supabase.from("shipments").select(READY_SELECT).eq("status", "inventory_received"),
  ]);
  if (quotesResult.error) throw new Error(`quotes: no se pudieron leer los orçamentos (${quotesResult.error.code})`);
  if (readyResult.error) throw new Error(`quotes: no se pudieron leer los pedidos (${readyResult.error.code})`);

  const quotes: Quote[] = quotesResult.data.map((row) => {
    const acceptance = row.acceptances[0] ?? null;
    const subtotal = row.quote_lines.reduce((sum, line) => sum + (line.optional ? 0 : line.total_cents), 0);
    const total = acceptance ? acceptance.signed_total_cents : subtotal + Math.round((subtotal * Number(row.vat_pct)) / 100);
    const { from, to } = endsOf(row.shipment.order, row.inventory?.inventory_addresses ?? []);
    const margin = subtotal > 0 && row.estimated_cost_cents !== null ? Math.round(((subtotal - row.estimated_cost_cents) / subtotal) * 100) : null;
    return {
      id: ORC(row.number),
      version: row.version,
      orderId: formatOrderNumber(row.shipment.number),
      client: row.shipment.client?.name ?? row.shipment.order.contact_name,
      from,
      to,
      volumeM3: Number(row.volume_m3 ?? 0),
      totalCents: total,
      marginPercent: includeMargin ? margin : null,
      status: row.status,
      createdAt: row.sent_at ?? row.created_at,
      validUntil: row.valid_until,
      acceptedAt: acceptance?.accepted_at ?? null,
      rejectionReason: row.rejected_reason,
    };
  });

  // Listos para orçamentar: inventario recibido y sin orçamento enviado (un borrador no cuenta)
  const readyOrders: ReadyOrder[] = readyResult.data
    .filter((row) => !row.quotes.some((quote) => quote.status === "sent"))
    .flatMap((row) => {
      const inventory = [...row.order.inventories].filter((i) => i.submitted_at).sort((a, b) => b.version - a.version)[0];
      if (!inventory) return [];
      const { from, to } = endsOf(row.order, inventory.inventory_addresses);
      return [
        {
          id: formatOrderNumber(row.number),
          client: row.client?.name ?? row.order.contact_name,
          from,
          to,
          volumeM3: inventory.inventory_lines.reduce((sum, line) => sum + line.quantity * Number(line.unit_volume_m3 ?? 0), 0),
          receivedAt: inventory.submitted_at as string,
          missingMeasures: inventory.inventory_lines.filter((line) => line.unit_volume_m3 === null).length,
        },
      ];
    })
    .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));

  // Indicadores de los últimos 30 días, sobre orçamentos enviados
  const since = Date.now() - 30 * DAY_MS;
  const recent = quotesResult.data.filter((row) => row.sent_at && Date.parse(row.sent_at) >= since);
  const firstVersions = recent.filter((row) => row.version === 1);
  const metrics: QuoteMetrics = {
    acceptanceRate: recent.length > 0 ? recent.filter((row) => row.status === "accepted").length / recent.length : 0,
    averageDaysToQuote:
      firstVersions.length > 0
        ? firstVersions.reduce((sum, row) => sum + (Date.parse(row.sent_at as string) - Date.parse(row.shipment.created_at)) / DAY_MS, 0) / firstVersions.length
        : 0,
  };

  return { quotes, readyOrders, metrics };
}

// =====================================================================
// Editor de orçamento (paso 5.4): lecturas con RLS y escrituras con save_quote_draft y send_quote, que vuelven a
// comprobar sesión, rol y que el envío es de la empresa.
// =====================================================================

type DbLift = Database["public"]["Enums"]["lift_size"];
const LIFT_FROM_DB: Record<DbLift, LiftSize> = { none: "none", small: "small", large: "normal" };

const EDITOR_SELECT = `id, number, status,
  client:clients(name),
  order:orders!inner(id, contact_name, desired_date,
    addresses(id, role, sort_order),
    inventories(id, version, submitted_at,
      inventory_addresses(address_id, address, floor, lift, parking_distance_m),
      inventory_lines(id, quantity, unit_volume_m3, unit_minutes, handling_flags,
        adjustments:inventory_line_adjustments(unit_volume_m3, unit_minutes)),
      inventory_extras(catalog_extra_id, note)
    )
  ),
  quotes(id, number, version, status, pricing_mode, km, operator_count, estimated_hours, valid_until, conditions, calculation,
    quote_lines(kind, company_extra_id, sort_order, description, quantity, unit, unit_price_cents, optional, origin))`;

/** Lo que el editor necesita de un pedido. `undefined` si el pedido no existe o no es de esta empresa (RLS). */
export async function getQuoteEditorData(orderNumber: string): Promise<QuoteEditorData | undefined> {
  const number = parseOrderNumber(orderNumber);
  if (number === null) return undefined;

  const supabase = await createSupabaseServerClient();
  const [{ data, error }, vehicles, tariff, extras] = await Promise.all([
    supabase.from("shipments").select(EDITOR_SELECT).eq("number", number).neq("status", "cancelled").maybeSingle(),
    supabase.from("vehicles").select("id, name, plate, capacity_m3, cost:vehicle_costs(cost_per_km_cents)").eq("active", true),
    getCurrentTariff(),
    getCompanyExtras(),
  ]);
  if (error) throw new Error(`quotes: no se pudo leer el pedido (${error.code})`);
  if (vehicles.error) throw new Error(`quotes: no se pudo leer la frota (${vehicles.error.code})`);
  if (!data) return undefined;
  if (!tariff) throw new Error("quotes: la empresa no tiene tarifa");

  const addresses = [...data.order.addresses].sort((a, b) => a.sort_order - b.sort_order);
  const inventory = [...data.order.inventories].filter((i) => i.submitted_at !== null).sort((a, b) => b.version - a.version)[0] ?? null;

  const quotes = [...data.quotes].sort((a, b) => b.version - a.version);
  const draftRow = quotes.find((q) => q.status === "draft") ?? null;
  const last = quotes.find((q) => q.status !== "draft") ?? null;

  const draft: EditorDraft | null = draftRow
    ? {
        pricingMode: draftRow.pricing_mode,
        km: draftRow.km === null ? null : Number(draftRow.km),
        operators: (draftRow.calculation as { final?: { operators?: number | null } })?.final?.operators ?? null,
        hours: (draftRow.calculation as { final?: { hours?: number | null } })?.final?.hours ?? null,
        validUntil: draftRow.valid_until ?? "",
        conditions: draftRow.conditions ?? "",
        lines: [...draftRow.quote_lines]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((line, index) => ({
            key: `saved-${index}`,
            kind: line.kind,
            code: ((line.kind === "base" ? (draftRow.calculation as { codes?: (string | null)[] })?.codes?.[index] : null) ?? null) as EditorLine["code"],
            companyExtraId: line.company_extra_id,
            description: line.description,
            quantity: Number(line.quantity),
            unit: line.unit,
            unitPriceCents: line.unit_price_cents,
            optional: line.optional,
            edited: line.origin === "manual",
          })),
      }
    : null;

  return {
    order: {
      id: formatOrderNumber(data.number),
      uuid: data.order.id,
      clientName: data.client?.name ?? data.order.contact_name,
      date: data.order.desired_date,
      status: data.status,
      route: addresses.map((address) => inventory?.inventory_addresses.find((row) => row.address_id === address.id)?.address ?? ""),
    },
    inventory: inventory ? { version: inventory.version, submittedAt: inventory.submitted_at as string } : null,
    calcBase: {
      lines: (inventory?.inventory_lines ?? []).map((line) => {
        // La corrección de esta empresa (RLS: solo la suya) manda sobre lo declarado (A2, RF-09)
        const adjustment = line.adjustments[0];
        const volume = adjustment?.unit_volume_m3 ?? line.unit_volume_m3;
        const minutes = adjustment?.unit_minutes ?? line.unit_minutes;
        return {
          quantity: line.quantity,
          unitVolumeM3: volume === null ? null : Number(volume),
          unitMinutes: minutes,
          flags: line.handling_flags.map(itemFlagOf),
        };
      }),
      points: addresses.flatMap((address) => {
        const row = inventory?.inventory_addresses.find((candidate) => candidate.address_id === address.id);
        return row ? [{ role: address.role, floor: row.floor, lift: LIFT_FROM_DB[row.lift], parkingMeters: row.parking_distance_m }] : [];
      }),
      tariff,
      vehicles: vehicles.data.map((vehicle) => {
        const cost = Array.isArray(vehicle.cost) ? vehicle.cost[0] : vehicle.cost;
        return {
          id: vehicle.id,
          name: vehicle.name ?? vehicle.plate,
          capacityM3: Number(vehicle.capacity_m3),
          costPerKmCents: cost?.cost_per_km_cents ?? null,
        };
      }),
    },
    markedExtras: (inventory?.inventory_extras ?? []).map((extra) => ({ typeId: extra.catalog_extra_id, note: extra.note })),
    tariff,
    extras,
    draft,
    draftNumber: draftRow?.number ?? last?.number ?? null,
    draftVersion: draftRow?.version ?? (last ? last.version + 1 : 1),
    last: last ? { version: last.version, status: last.status, validUntil: last.valid_until } : null,
  };
}

/** Errores de save_quote_draft y send_quote → códigos del editor. */
function quoteErrorOf(error: { code?: string; message?: string }): QuoteError {
  switch (error.message) {
    case "not allowed":
      return "notAllowed";
    case "no inventory":
      return "noInventory";
    case "shipment closed":
      return "shipmentClosed";
    case "inventory changed":
      return "inventoryChanged";
    case "empty quote":
      return "empty";
    case "invalid validity":
      return "invalidValidity";
    case "invalid payload":
      return "invalid";
    default:
      // 23514/22P02/22023: algún `check` o dato que no encaja
      return error.code === "23514" || error.code === "22P02" || error.code === "22023" ? "invalid" : "failed";
  }
}

/** Guarda el borrador del orçamento del pedido (save_quote_draft). */
export async function saveQuoteDraft(orderUuid: string, quote: Record<string, unknown>, lines: readonly Record<string, unknown>[]): Promise<QuoteSaveResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("save_quote_draft", { p_order_id: orderUuid, p_quote: quote as Json, p_lines: lines as Json });
  if (error || !data) return { ok: false, error: error ? quoteErrorOf(error) : "failed" };
  return { ok: true, quoteId: data };
}

/** Envía el borrador al cliente (send_quote): congela lo que firmará y pasa el pedido a "Orçamentado". */
export async function sendQuote(quoteId: string): Promise<{ ok: true; version: number } | { ok: false; error: QuoteError }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("send_quote", { p_quote_id: quoteId });
  if (error) return { ok: false, error: quoteErrorOf(error) };
  return { ok: true, version: data };
}

/** Id del pedido (uuid) a partir del número visible. RLS: solo si la empresa tiene un envío en él. */
export async function orderUuidOf(orderNumber: string): Promise<string | undefined> {
  const number = parseOrderNumber(orderNumber);
  if (number === null) return undefined;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("shipments").select("order_id").eq("number", number).neq("status", "cancelled").maybeSingle();
  if (error) throw new Error(`quotes: no se pudo leer el pedido (${error.code})`);
  return data?.order_id;
}
