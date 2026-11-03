/** Cuidados por defecto de un objeto. Cada inventario los ajusta después. */
export type CareMark = "fragile" | "disassembly" | "extra_crew";

/** Divisão o categoría: misma forma, distinto significado. */
export type CatalogGroup = {
  slug: string;
  /** Posición en el inventario del cliente (menor aparece primero). */
  order: number;
  pt: string;
  es: string;
  en: string;
  /** Nombre del ícono Lucide. */
  icon: string;
};

export type CatalogItem = {
  id: string;
  pt: string;
  /** Vacío si falta la traducción. */
  es: string;
  en: string;
  /** Slug de la categoría (una sola). */
  category: string;
  /** Slugs de las divisões donde puede aparecer. */
  rooms: readonly string[];
  marks: readonly CareMark[];
  active: boolean;
};

export type CatalogTab = "objects" | "rooms" | "categories";
