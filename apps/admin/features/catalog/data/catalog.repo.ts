import "server-only";

import type { CatalogGroup, CatalogItem } from "../domain/types";
import { CATEGORIES, ITEMS, ROOMS } from "./mock";

// Única puerta de entrada a los datos del catálogo: las páginas importan de aquí.
// TODO(supabase): ahora devuelve datos de ejemplo. Al conectar las tablas se sustituye la
// implementación y se mantienen las firmas.

export async function listItems(): Promise<readonly CatalogItem[]> {
  return ITEMS;
}

export async function listRooms(): Promise<readonly CatalogGroup[]> {
  return ROOMS;
}

export async function listCategories(): Promise<readonly CatalogGroup[]> {
  return CATEGORIES;
}
