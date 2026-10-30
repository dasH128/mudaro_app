import "server-only";

import type { CatalogItem, ExtraService } from "../domain/types";
import { mockCatalog, mockExtras } from "./mock-data";

// Única puerta de entrada a los datos del inventario: páginas y acciones importan de aquí.
// TODO(supabase): leer el catálogo y los extras activos de la empresa de la sesión (RLS por company_id, RNF-01).

/** Objetos del catálogo de la empresa. */
export async function getCatalog(): Promise<readonly CatalogItem[]> {
  return mockCatalog;
}

/** Servicios extra activos en Tarifas y extras. */
export async function getActiveExtras(): Promise<readonly ExtraService[]> {
  return mockExtras;
}
