// Lo que el cliente ve de su pedido desde el enlace (RF-19 a RF-26). TypeScript puro: sin React, Next ni Supabase.
// Las entidades del inventario (catálogo, accesos, borrador) son las mismas que usa la empresa: @mudaro/inventory.

import type { CatalogItem, CatalogRoom, ExtraType, InventoryDraft, RoutePoint } from "@mudaro/inventory";

/** Datos del pedido que se muestran al cliente. Nada interno de la empresa salvo su nombre. */
export type ClientOrder = {
  companyName: string;
  /** Nombre de contacto del pedido, tal como lo escribió la empresa. */
  contactName: string;
  /** Fecha aproximada de la mudanza, aaaa-mm-dd. */
  date: string;
  /** Fin de la validez del enlace (ISO). */
  expiresAt: string | null;
};

/** Una línea del orçamento tal como se envió (snapshot). Importes sin IVA, en céntimos. */
export type ClientQuoteLine = {
  id: string;
  kind: "base" | "extra" | "manual";
  description: string;
  quantity: number;
  unit: string | null;
  unitPriceCents: number;
  totalCents: number;
  /** El cliente decide si lo quiere al aceptar (decisión 1 del paso 5). */
  optional: boolean;
};

/** El orçamento vigente del pedido (RF-41): lo que envió la empresa, sin coste ni margen (RNF-03). */
export type ClientQuote = {
  id: string;
  status: "sent" | "accepted" | "rejected" | "superseded";
  /** Enviado y con la validez ya pasada (RF-45). */
  expired: boolean;
  /** aaaa-mm-dd */
  validUntil: string | null;
  /** Huella del documento (P5): se devuelve al aceptar para firmar exactamente esto. */
  documentHash: string;
  number: number;
  version: number;
  pricingMode: "fixed" | "hourly";
  hourlyRateCents: number | null;
  operatorCount: number | null;
  estimatedHours: number | null;
  vatPct: number;
  conditions: string | null;
  lines: readonly ClientQuoteLine[];
  /** Inventario sobre el que se calculó (RF-39), con los nombres en el idioma de la interfaz. */
  inventory: { version: number; lines: readonly { name: string; room: string; quantity: number }[] };
  acceptance: {
    acceptedAt: string;
    signerName: string;
    selectedLineIds: readonly string[];
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
  } | null;
};

/** Estado del pedido al abrir el enlace. */
export type ClientOrderView =
  /** Hay borrador y el enlace está vigente: el cliente rellena el inventario. */
  | {
      kind: "draft";
      order: ClientOrder;
      quote: ClientQuote | null;
      version: number;
      points: readonly RoutePoint[];
      draft: InventoryDraft;
      rooms: readonly CatalogRoom[];
      catalog: readonly CatalogItem[];
      extras: readonly ExtraType[];
    }
  /** El cliente (o la empresa) ya envió el inventario y no hay borrador abierto. */
  | { kind: "submitted"; order: ClientOrder; quote: ClientQuote | null; version: number; submittedAt: string }
  /** El enlace caducó con el inventario sin enviar: ya no se puede editar (RF-15). */
  | { kind: "expired"; order: ClientOrder; quote: ClientQuote | null };

/** Por qué no se pudo guardar o enviar. Códigos: la interfaz los traduce. */
export const CLIENT_ERRORS = [
  "accessIncomplete",
  "empty",
  "expired",
  "notFound",
  "noDraft",
  "invalid",
  "failed",
  "quoteClosed",
  "quoteExpired",
  "documentChanged",
] as const;
export type ClientError = (typeof CLIENT_ERRORS)[number];

export type ClientResult = { ok: true } | { ok: false; error: ClientError };

/** El token del enlace: 32 bytes en hexadecimal (share_order_link). Cualquier otra cosa no es un enlace. */
export function isLinkToken(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}

/** Primer nombre del contacto, para el saludo. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}
