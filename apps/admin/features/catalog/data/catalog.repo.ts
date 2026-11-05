import "server-only";

import type { CatalogGroup, CatalogItem } from "../domain/types";
import { toCategory, toItem, toRoom } from "./catalog.mapper";
import { selectCategoryRows, selectItemRows, selectRoomRows } from "./catalog.queries";

// Única puerta de entrada a los datos del catálogo: las páginas importan de aquí.
// Lectura real desde Supabase (RLS por rol de plataforma). Las altas y cambios (RF-12) pasarán por
// Edge Functions con registro en audit_log (RNF-08); todavía no existen.

/** Objetos activos e inactivos, ordenados por `sort_order`. */
export async function listItems(): Promise<readonly CatalogItem[]> {
  const rows = await selectItemRows();
  return rows.map(toItem);
}

export async function listRooms(): Promise<readonly CatalogGroup[]> {
  const rows = await selectRoomRows();
  return rows.map(toRoom);
}

export async function listCategories(): Promise<readonly CatalogGroup[]> {
  const rows = await selectCategoryRows();
  return rows.map(toCategory);
}
