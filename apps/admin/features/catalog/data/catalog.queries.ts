import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

// Usa la sesión del usuario, no la clave de servicio: la RLS de las tablas catalog_* deja ver
// también lo inactivo al equipo Mudaro (is_platform_user), que es lo que necesita este panel.
// Las lecturas van en una sola consulta por entidad, con las traducciones y relaciones anidadas (sin N+1).

/** Registra el detalle en el log del servidor; hacia fuera solo sale un error genérico. */
function fail(scope: string, error: unknown): never {
  console.error(`[catalog] ${scope} failed:`, error);
  throw new Error(`Failed to load catalog ${scope}`);
}

export async function selectItemRows() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("catalog_items")
    .select(
      `
      id,
      active,
      sort_order,
      handling_flags,
      volume_m3,
      max_dimension_cm,
      weight_kg,
      handling_minutes,
      catalog_categories ( slug ),
      catalog_item_translations ( locale, name ),
      catalog_item_rooms ( catalog_rooms ( slug ) )
    `,
    )
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true });

  if (error) fail("items", error);
  return data;
}

export async function selectRoomRows() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("catalog_rooms")
    .select("slug, icon, sort_order, catalog_room_translations ( locale, name )")
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true });

  if (error) fail("rooms", error);
  return data;
}

export async function selectCategoryRows() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("catalog_categories")
    .select("slug, icon, sort_order, catalog_category_translations ( locale, name )")
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true });

  if (error) fail("categories", error);
  return data;
}

/** Filas tal como las devuelve la base de datos. Solo las conoce la capa `data/`. */
export type CatalogItemRow = Awaited<ReturnType<typeof selectItemRows>>[number];
export type CatalogRoomRow = Awaited<ReturnType<typeof selectRoomRows>>[number];
export type CatalogCategoryRow = Awaited<ReturnType<typeof selectCategoryRows>>[number];
