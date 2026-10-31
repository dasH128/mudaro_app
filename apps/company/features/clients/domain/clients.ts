import { daysBetween } from "@/features/fleet/domain/fleet";
import type { Client, ClientStage } from "./types";

// Reglas de la lista de clientes: situación, filtros, orden y avisos. Lógica pura, sin React ni Next.

export const FILTERS = ["all", "negotiating", "scheduled", "done", "companies", "returned"] as const;
export type ClientFilter = (typeof FILTERS)[number];
export const DEFAULT_FILTER: ClientFilter = "all";
/** Los que salen como pastilla en la barra. "Voltaram" se alcanza desde el aviso, sin pastilla propia (como en el diseño). */
export const CHIP_FILTERS = ["all", "negotiating", "scheduled", "done", "companies"] as const satisfies readonly ClientFilter[];

export const SORTS = ["lastContact", "name", "accepted", "orders"] as const;
export type ClientSort = (typeof SORTS)[number];
export const DEFAULT_SORT: ClientSort = "lastContact";

export const isFilter = (value: string | undefined): value is ClientFilter => FILTERS.some((f) => f === value);
export const isSort = (value: string | undefined): value is ClientSort => SORTS.some((s) => s === value);

const NEGOTIATING: readonly ClientStage[] = ["new", "awaiting-inventory", "inventory-received", "quoted"];
const SCHEDULED: readonly ClientStage[] = ["scheduled", "in-progress"];
/** Pedidos con una proposta aceptada: la mudança está marcada, en curso o hecha. */
const ACCEPTED: readonly ClientStage[] = ["scheduled", "in-progress", "done"];

export const isNegotiating = (client: Client): boolean => NEGOTIATING.includes(client.stage);
export const isScheduled = (client: Client): boolean => SCHEDULED.includes(client.stage);

/** Suma de las propostas aceptadas, o `null` si no hay ninguna (la lista muestra "—"). */
export function acceptedTotal(client: Client): number | null {
  const total = client.orders.reduce((sum, order) => sum + (order.acceptedCents ?? 0), 0);
  return total > 0 ? total : null;
}

export const doneCount = (client: Client): number => client.orders.filter((order) => order.stage === "done").length;

/** Volvió: ya tiene una mudança aceptada y, además, otro pedido que no se perdió. */
export function isReturning(client: Client): boolean {
  const hasAccepted = client.orders.some((order) => ACCEPTED.includes(order.stage));
  return hasAccepted && client.orders.filter((order) => order.stage !== "lost").length >= 2;
}

export type ClientSummaryCounts = Record<ClientFilter, number>;

export function countByFilter(clients: readonly Client[]): ClientSummaryCounts {
  return {
    all: clients.length,
    negotiating: clients.filter(isNegotiating).length,
    scheduled: clients.filter(isScheduled).length,
    done: clients.filter((c) => c.stage === "done").length,
    companies: clients.filter((c) => c.type === "company").length,
    returned: clients.filter(isReturning).length,
  };
}

/** Minúsculas y sin tildes, espacios ni guiones, para buscar por nombre, teléfono, email o NIF. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s-]/g, "")
    .toLowerCase();
}

function matches(client: Client, filter: ClientFilter): boolean {
  switch (filter) {
    case "negotiating":
      return isNegotiating(client);
    case "scheduled":
      return isScheduled(client);
    case "done":
      return client.stage === "done";
    case "companies":
      return client.type === "company";
    case "returned":
      return isReturning(client);
    case "all":
      return true;
  }
}

function compare(sort: ClientSort): (a: Client, b: Client) => number {
  switch (sort) {
    case "lastContact":
      return (a, b) => b.lastContact.on.localeCompare(a.lastContact.on);
    case "name":
      return (a, b) => a.name.localeCompare(b.name, "pt");
    case "accepted":
      return (a, b) => (acceptedTotal(b) ?? 0) - (acceptedTotal(a) ?? 0);
    case "orders":
      return (a, b) => b.orders.length - a.orders.length;
  }
}

export type ClientQuery = { filter: ClientFilter; q: string; sort: ClientSort };

/** Clientes filtrados, buscados y ordenados. Es también el orden de navegación del panel. */
export function arrangeClients(clients: readonly Client[], { filter, q, sort }: ClientQuery): Client[] {
  const needle = normalize(q);
  const found = (c: Client) => needle === "" || normalize(`${c.name}${c.phone}${c.email ?? ""}${c.taxId ?? ""}`).includes(needle);
  return clients.filter((c) => found(c) && matches(c, filter)).sort(compare(sort));
}

/** Una empresa sin NIF no puede exportarse para facturar. */
export const lacksTaxId = (client: Client): boolean => client.type === "company" && client.taxId === null;

export type ClientAlerts = {
  /** Empresa sin NIF con una mudança por delante, la más cercana. */
  missingTaxId: { client: Client; moveOn: string } | null;
  /** Primera ficha que puede estar repetida. */
  duplicate: Client | null;
  /** Clientes que ya tienen un segundo pedido. */
  returned: Client[];
};

export function clientAlerts(clients: readonly Client[], today: string): ClientAlerts {
  const upcoming = clients
    .filter(lacksTaxId)
    .flatMap((client) =>
      client.orders.filter((order) => ACCEPTED.includes(order.stage) && order.moveOn >= today).map((order) => ({ client, moveOn: order.moveOn })),
    )
    .sort((a, b) => a.moveOn.localeCompare(b.moveOn))[0];

  return {
    missingTaxId: upcoming ?? null,
    duplicate: clients.find((c) => c.duplicate !== undefined) ?? null,
    returned: clients.filter(isReturning),
  };
}

/** Días desde el último contacto (0 = hoy). */
export const daysSinceContact = (client: Client, today: string): number => Math.max(daysBetween(client.lastContact.on, today), 0);

