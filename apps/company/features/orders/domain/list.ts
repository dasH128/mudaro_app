import { daysBetween } from "@/features/proposals/domain/status";
import { ORDER_STAGES, type OrderListItem, type OrderNote, type OrderStage } from "./types";

/** Pedidos por página (vista en lista) y por tanda de "Ver mais" (vista en cartões). */
export const PAGE_SIZE = 10;

export const VIEWS = ["cards", "list"] as const;
export type OrdersView = (typeof VIEWS)[number];
export const DEFAULT_VIEW: OrdersView = "cards";

/** Filtro de la lista: una etapa, o "action" para los pedidos que esperan algo de la empresa. */
export type OrdersFilter = OrderStage | "action";

export function isFilter(value: string | undefined): value is OrdersFilter {
  return value === "action" || ORDER_STAGES.some((stage) => stage === value);
}

export function isView(value: string | undefined): value is OrdersView {
  return VIEWS.some((view) => view === value);
}

/** Avance de cada etapa en la barra de cinco puntos. "Perdido" se queda donde se cayó. */
export const STEP_OF: Record<OrderStage, number> = {
  new: 1,
  "awaiting-inventory": 2,
  "inventory-received": 3,
  quoted: 4,
  won: 5,
  lost: 4,
};

/** Notas que piden algo a la empresa ("Precisam de ti"), de más a menos prioritaria. */
const ATTENTION: readonly OrderNote["kind"][] = [
  "inventory-ready",
  "inventory-missing-measures",
  "draft-proposal",
  "link-expiring",
  "no-news",
];

/** Notas que, además, avisan de un riesgo (se destacan en ámbar). */
const WARN: readonly OrderNote["kind"][] = ["inventory-missing-measures", "link-expiring", "no-news"];

export function needsAttention(item: OrderListItem): boolean {
  return ATTENTION.includes(item.note.kind);
}

export function isWarn(note: OrderNote): boolean {
  return WARN.includes(note.kind);
}

/** Siguiente paso de un pedido. Son códigos: el texto y el destino los pone la interfaz. */
export type OrderAction =
  | "create-proposal"
  | "continue-proposal"
  | "resend-link"
  | "share-link"
  | "copy-link"
  | "fill-inventory"
  | "view-proposal"
  | "view-job";

export function nextAction(note: OrderNote): OrderAction | null {
  switch (note.kind) {
    case "inventory-ready":
    case "inventory-missing-measures":
      return "create-proposal";
    case "draft-proposal":
      return "continue-proposal";
    case "link-expiring":
    case "no-news":
      return "resend-link";
    case "just-created":
      return "share-link";
    case "just-created-self":
      return "fill-inventory";
    case "filling":
      return "copy-link";
    case "proposal-sent":
      return "view-proposal";
    case "won":
      return "view-job";
    case "lost":
      return null;
  }
}

/** Minúsculas y sin tildes, para que "joao" encuentre "João". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Filtra por etapa (o "action") y por texto (cliente o nº de pedido). */
export function filterOrders(
  items: readonly OrderListItem[],
  filter: OrdersFilter | undefined,
  query: string,
): readonly OrderListItem[] {
  const needle = normalize(query.trim());
  return items.filter((item) => {
    if (filter === "action" ? !needsAttention(item) : filter && item.stage !== filter) return false;
    if (needle === "") return true;
    return [item.client, item.id].some((field) => normalize(field).includes(needle));
  });
}

const byActivity = (a: OrderListItem, b: OrderListItem) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt);

export function sortByActivity(items: readonly OrderListItem[]): readonly OrderListItem[] {
  return [...items].sort(byActivity);
}

/** "Precisam de ti": primero lo más prioritario y, a igual prioridad, la mudança más próxima. */
export function sortAttention(items: readonly OrderListItem[]): readonly OrderListItem[] {
  const rank = (item: OrderListItem) => ATTENTION.indexOf(item.note.kind);
  return [...items].sort((a, b) => rank(a) - rank(b) || a.date.localeCompare(b.date));
}

/** Tabla: lo que espera algo de la empresa primero, y después por última atividade. */
export function sortForTable(items: readonly OrderListItem[]): readonly OrderListItem[] {
  return [...items].sort((a, b) => Number(needsAttention(b)) - Number(needsAttention(a)) || byActivity(a, b));
}

export function countByStage(items: readonly OrderListItem[]): Record<OrderStage, number> {
  const counts = Object.fromEntries(ORDER_STAGES.map((stage) => [stage, 0])) as Record<OrderStage, number>;
  for (const item of items) counts[item.stage] += 1;
  return counts;
}

/** Etapas con algún pedido que pide algo a la empresa (llevan el punto naranja). */
export function stagesWithAttention(items: readonly OrderListItem[]): ReadonlySet<OrderStage> {
  return new Set(items.filter(needsAttention).map((item) => item.stage));
}

/** Resumen de "Precisam de ti": cuántos están listos para orçamentar y cuántos necesitan un empujón. */
export function summarizeAttention(items: readonly OrderListItem[]) {
  const attention = items.filter(needsAttention);
  const ready = attention.filter((item) => item.stage === "inventory-received").length;
  return { total: attention.length, ready, nudge: attention.length - ready };
}

/** Próximas mudanças: las que tienen día concreto y siguen vivas, de la más cercana a la más lejana. */
export function upcomingMoves(items: readonly OrderListItem[], today: string, limit: number): readonly OrderListItem[] {
  return items
    .filter((item) => item.stage !== "lost" && item.flexibility !== "month" && daysBetween(today, item.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

/** Páginas de `size` a partir de la 1. Devuelve la página pedida, ajustada a las que hay. */
export function paginate<T>(items: readonly T[], page: number, size: number = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(page, 1), pages);
  return { rows: items.slice((current - 1) * size, current * size), page: current, pages };
}
