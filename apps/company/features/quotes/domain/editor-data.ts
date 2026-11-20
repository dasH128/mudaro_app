// Lo que la página del editor de orçamento recibe del repo. TypeScript puro.

import type { CalcInput } from "@mudaro/quotes";

import type { CompanyExtra, Tariff } from "@/features/pricing/domain/types";
import type { EditorDraft } from "./editor";

/** Estado del envío en la base de datos (`shipment_status`). */
export type ShipmentStatus = "new" | "awaiting_inventory" | "inventory_received" | "quoted" | "won" | "lost" | "cancelled";

export type QuoteEditorData = {
  order: {
    /** Número visible (MD-0005). */
    id: string;
    /** Id del pedido en la base de datos: lo usa save_quote_draft. Nunca sale del servidor salvo en el formulario. */
    uuid: string;
    clientName: string;
    /** Fecha deseada, aaaa-mm-dd. */
    date: string;
    status: ShipmentStatus;
    /** Direcciones en orden de recorrido: origen, paradas y destino. */
    route: readonly string[];
  };
  /** Versión vigente del inventario (la última enviada). `null` si aún no hay ninguna. */
  inventory: { version: number; submittedAt: string } | null;
  /** Datos del pedido para el cálculo, sin los km (los escribe la empresa). */
  calcBase: Omit<CalcInput, "km">;
  /** Tipos de extra que marcó el cliente, con su nota. */
  markedExtras: readonly { typeId: string; note: string | null }[];
  tariff: Tariff;
  extras: readonly CompanyExtra[];
  /** Borrador guardado. `null` = orçamento nuevo. */
  draft: EditorDraft | null;
  /** Número del orçamento (compartido por sus versiones). `null` hasta guardar el primero. */
  draftNumber: number | null;
  draftVersion: number;
  /** Última versión enviada, aceptada, rechazada o sustituida. */
  last: { version: number; status: string; validUntil: string | null } | null;
};
