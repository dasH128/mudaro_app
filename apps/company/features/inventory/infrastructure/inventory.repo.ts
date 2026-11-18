import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";
import type { Database } from "@mudaro/supabase";

import type { CatalogItem, ExtraType } from "../domain/types";
import { mockCatalog } from "./mock-data";

// Única puerta de entrada a los datos del inventario: páginas y acciones importan de aquí.
// TODO(supabase): leer el catálogo de objetos de la empresa de la sesión (RLS por company_id, RNF-01).

type AppLocale = Database["public"]["Enums"]["app_locale"];

/** El portugués es obligatorio en el catálogo: es el respaldo si falta una traducción. */
const FALLBACK_LOCALE: AppLocale = "pt";

/** Objetos del catálogo de la empresa. */
export async function getCatalog(): Promise<readonly CatalogItem[]> {
  return mockCatalog;
}

/**
 * Tipos de servicio extra del catálogo de Mudaro, activos y por orden (RF-24), con nombre y descripción en el
 * idioma pedido. La RLS ya oculta los inactivos a las empresas; el filtro lo deja explícito.
 */
export async function getExtraTypes(locale: AppLocale): Promise<readonly ExtraType[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("catalog_extras")
    .select("slug, translations:catalog_extra_translations(locale, name, description)")
    .eq("active", true)
    .order("sort_order")
    .order("slug");
  if (error) throw new Error(`inventory: no se pudieron leer los tipos de extra (${error.code})`);

  return data.flatMap((row) => {
    const text =
      row.translations.find((t) => t.locale === locale) ?? row.translations.find((t) => t.locale === FALLBACK_LOCALE);
    // Sin portugués no hay nombre que mostrar: el panel interno lo exige al crear el tipo
    return text ? [{ id: row.slug, name: text.name, description: text.description }] : [];
  });
}
