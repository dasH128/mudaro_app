import type { CatalogGroup, CatalogItem, CatalogTab } from "./types";

export const TABS = ["objects", "rooms", "categories"] as const satisfies readonly CatalogTab[];

export function isTab(value: string | undefined): value is CatalogTab {
  return TABS.some((tab) => tab === value);
}

export const MARK_FILTERS = ["fragile", "disassembly", "extra_crew", "translation_missing"] as const;
export type MarkFilter = (typeof MARK_FILTERS)[number];

export const STATE_FILTERS = ["active", "inactive", "all"] as const;
export type StateFilter = (typeof STATE_FILTERS)[number];

export type ObjectFilters = {
  q: string;
  /** Slug de categoría, o undefined para todas. */
  category: string | undefined;
  room: string | undefined;
  mark: MarkFilter | undefined;
  state: StateFilter;
};

type RawParams = { q?: string; category?: string; room?: string; mark?: string; state?: string };

/** Valores desconocidos de la URL se ignoran en vez de dar error. */
export function parseObjectFilters(
  raw: RawParams,
  categories: readonly CatalogGroup[],
  rooms: readonly CatalogGroup[],
): ObjectFilters {
  const state = STATE_FILTERS.find((s) => s === raw.state);
  return {
    q: raw.q?.trim() ?? "",
    category: categories.find((c) => c.slug === raw.category)?.slug,
    room: rooms.find((r) => r.slug === raw.room)?.slug,
    mark: MARK_FILTERS.find((m) => m === raw.mark),
    state: state ?? "active",
  };
}

export function isMissingTranslation(item: CatalogItem): boolean {
  return !item.es || !item.en;
}

/** Minúsculas y sin acentos, para que "sofa" encuentre "Sofá". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function filterItems(items: readonly CatalogItem[], filters: ObjectFilters): CatalogItem[] {
  const needle = normalize(filters.q);
  return items.filter((item) => {
    if (filters.state === "active" && !item.active) return false;
    if (filters.state === "inactive" && item.active) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.room && !item.rooms.includes(filters.room)) return false;
    const mark = filters.mark;
    if (mark === "translation_missing") {
      if (!isMissingTranslation(item)) return false;
    } else if (mark && !item.marks.includes(mark)) {
      return false;
    }
    if (!needle) return true;
    return [item.pt, item.es, item.en].some((name) => normalize(name).includes(needle));
  });
}

/** Objetos activos por divisão o categoría, para la columna "Objetos". */
export function countActiveBy(items: readonly CatalogItem[], tab: "rooms" | "categories"): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.active) continue;
    const slugs = tab === "rooms" ? item.rooms : [item.category];
    for (const slug of slugs) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return counts;
}
