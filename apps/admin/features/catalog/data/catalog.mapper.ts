import type { CatalogGroup, CatalogItem } from "../domain/types";
import type { CatalogCategoryRow, CatalogItemRow, CatalogRoomRow } from "./catalog.queries";

type Locale = "pt" | "es" | "en";

type Translation = { locale: Locale; name: string };

/** Nombre en un idioma. Una traducción que falta es una fila ausente: se devuelve "" (RF-11). */
function nameIn(translations: readonly Translation[], locale: Locale): string {
  return translations.find((t) => t.locale === locale)?.name ?? "";
}

function toGroup(row: {
  slug: string;
  icon: string | null;
  sort_order: number;
  translations: readonly Translation[];
}): CatalogGroup {
  return {
    slug: row.slug,
    order: row.sort_order,
    pt: nameIn(row.translations, "pt"),
    es: nameIn(row.translations, "es"),
    en: nameIn(row.translations, "en"),
    icon: row.icon ?? "",
  };
}

export function toRoom(row: CatalogRoomRow): CatalogGroup {
  return toGroup({ ...row, translations: row.catalog_room_translations });
}

export function toCategory(row: CatalogCategoryRow): CatalogGroup {
  return toGroup({ ...row, translations: row.catalog_category_translations });
}

export function toItem(row: CatalogItemRow): CatalogItem {
  const translations = row.catalog_item_translations;
  return {
    id: row.id,
    pt: nameIn(translations, "pt"),
    es: nameIn(translations, "es"),
    en: nameIn(translations, "en"),
    // La categoría es obligatoria en la base (not null + FK); si RLS la ocultara llegaría null.
    category: row.catalog_categories?.slug ?? "",
    rooms: row.catalog_item_rooms.flatMap((link) => (link.catalog_rooms ? [link.catalog_rooms.slug] : [])),
    marks: row.handling_flags,
    volumeM3: row.volume_m3,
    maxDimensionCm: row.max_dimension_cm,
    weightKg: row.weight_kg,
    handlingMinutes: row.handling_minutes,
    active: row.active,
  };
}
