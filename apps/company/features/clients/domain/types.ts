import type { ClientType } from "@/features/orders/domain/types";

// Entidades de los clientes (RF-14). Importes en céntimos, fechas ISO (aaaa-mm-dd), horas hh:mm de Lisboa
// y teléfono normalizado (+351…). El texto que ve la persona lo pone la interfaz a partir de estos códigos.

/** Situación del cliente según su pedido más relevante. */
export const CLIENT_STAGES = [
  "new",
  "awaiting-inventory",
  "inventory-received",
  "quoted",
  "scheduled",
  "in-progress",
  "done",
  "lost",
] as const;
export type ClientStage = (typeof CLIENT_STAGES)[number];

/** Qué hizo el cliente la última vez que se supo de él. Sin evento, solo cuenta cuánto hace. */
export type ContactEvent =
  | "move-in-progress"
  | "pickup-signed"
  | "sent-inventory"
  | "accepted-quote"
  | "declined-quote"
  | "accepted-signed"
  | "signed-delivery"
  | "order-created";

export type LastContact = { on: string; event?: ContactEvent };

/** Línea de detalle de la fila: qué pasa ahora con su pedido. */
export type ClientSummary =
  | { kind: "in-progress"; orderId: string; quoteExpiring?: boolean }
  | { kind: "today-draft"; orderId: string }
  | { kind: "inventory-arrived"; orderId: string; hoursAgo: number }
  | { kind: "missing-measure"; orderId: string; objects: number }
  | { kind: "link-expires"; orderId: string }
  | { kind: "no-news"; orderId: string; days: number }
  | { kind: "share-link"; orderId: string }
  | { kind: "scheduled"; orderId: string; on: string; time: string; noResources?: boolean }
  | { kind: "delivered"; orderId: string; on: string }
  | { kind: "closed"; orderId: string; on: string }
  /** `reason` es texto libre de la empresa: no se traduce. */
  | { kind: "lost"; orderId: string; reason: string };

/** Nota de un pedido en el panel del cliente. */
export type OrderNote =
  | { kind: "quote-sent"; version: number; expiresInDays: number }
  | { kind: "in-progress"; vehicle: string; crew: string[] }
  | { kind: "closed"; amountCents: number }
  | { kind: "draft"; since: string }
  | { kind: "short-staffed"; time: string; missing: number }
  | { kind: "other-file"; fileName: string }
  | { kind: "scheduled"; vehicle: string; start: string; end: string }
  /** Sin nota propia: se repite el último contacto del cliente. */
  | { kind: "last-contact" };

export type ClientOrder = {
  /** Número de pedido (MD-0824). */
  id: string;
  /** "Lisboa → Oeiras": direcciones de la empresa, no se traducen. */
  route: string;
  /** Día de la mudança, aaaa-mm-dd. */
  moveOn: string;
  stage: ClientStage;
  note: OrderNote;
  /** Importe de la proposta aceptada, con IVA. `null` si aún no hay ninguna. */
  acceptedCents: number | null;
};

export type AddressUse = { kind: "orders"; count: number } | { kind: "origin" } | { kind: "destination" } | { kind: "see-order" };

/** Otra ficha con el mismo teléfono: puede ser la misma persona. */
export type DuplicateCandidate = {
  name: string;
  phone: string;
  hasEmail: boolean;
  orderId: string;
  /** Día en que se perdió su pedido, aaaa-mm-dd. */
  lostOn: string;
};

export type Client = {
  id: string;
  name: string;
  type: ClientType;
  /** Teléfono normalizado: +351XXXXXXXXX. */
  phone: string;
  email: string | null;
  /** 9 dígitos. Una empresa sin NIF no puede exportarse para facturar. */
  taxId: string | null;
  /** Día en que se creó la ficha, aaaa-mm-dd. */
  sinceOn: string;
  stage: ClientStage;
  summary: ClientSummary;
  lastContact: LastContact;
  /** Del más reciente al más antiguo. */
  orders: ClientOrder[];
  addresses: { text: string; use: AddressUse }[];
  duplicate?: DuplicateCandidate;
};

export type ClientsOverview = { clients: Client[] };
