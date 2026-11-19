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

/** Estado del pedido al abrir el enlace. */
export type ClientOrderView =
  /** Hay borrador y el enlace está vigente: el cliente rellena el inventario. */
  | {
      kind: "draft";
      order: ClientOrder;
      version: number;
      points: readonly RoutePoint[];
      draft: InventoryDraft;
      rooms: readonly CatalogRoom[];
      catalog: readonly CatalogItem[];
      extras: readonly ExtraType[];
    }
  /** El cliente (o la empresa) ya envió el inventario y no hay borrador abierto. */
  | { kind: "submitted"; order: ClientOrder; version: number; submittedAt: string }
  /** El enlace caducó con el inventario sin enviar: ya no se puede editar (RF-15). */
  | { kind: "expired"; order: ClientOrder };

/** Por qué no se pudo guardar o enviar. Códigos: la interfaz los traduce. */
export const CLIENT_ERRORS = ["accessIncomplete", "empty", "expired", "notFound", "noDraft", "invalid", "failed"] as const;
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
