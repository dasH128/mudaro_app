import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

import type { CompanyExtra, Tariff, TariffInput } from "../domain/types";

// Única puerta de entrada a la tarifa y los servicios extra. Lecturas con RLS: la tarifa solo la leen los
// administradores de la empresa (RNF-03) y los servicios, los miembros de la empresa. Las escrituras pasan por
// save_tariff y save_company_extra, que vuelven a comprobar sesión y rol.

/** Tarifa vigente de la empresa (la de versión más alta). `null` si aún no tiene, que no debería pasar: la base crea la v1. */
export async function getCurrentTariff(): Promise<Tariff | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("tariffs").select("*").order("version", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`pricing: no se pudo leer la tarifa (${error.code})`);
  if (!data) return null;
  return {
    version: data.version,
    validFrom: data.valid_from,
    operatorHourPriceCents: data.operator_hour_price_cents,
    operatorHourCostCents: data.operator_hour_cost_cents,
    kmPriceCents: data.km_price_cents,
    noLiftFloorSurchargeCents: data.no_lift_floor_surcharge_cents,
    parkingSurchargeCents: data.parking_surcharge_cents,
    minimumServiceCents: data.minimum_service_cents,
    stowageFactor: Number(data.stowage_factor),
    averageSpeedKmh: Number(data.average_speed_kmh),
    vatPct: Number(data.vat_pct),
    noLiftFloorExtraPct: Number(data.no_lift_floor_extra_pct),
    parkingExtraPctPer25m: Number(data.parking_extra_pct_per_25m),
    crewSmall: data.crew_small,
    crewSmallMaxM3: Number(data.crew_small_max_m3),
    crewMedium: data.crew_medium,
    crewMediumMaxM3: Number(data.crew_medium_max_m3),
    crewLarge: data.crew_large,
    quotePresentation: data.quote_presentation,
    quoteValidityDays: data.quote_validity_days,
  };
}

/** Servicios extra de la empresa, activos primero y por nombre. */
export async function getCompanyExtras(): Promise<CompanyExtra[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("company_extras")
    .select("id, catalog_extra_id, name, price_mode, price_cents, active")
    .order("active", { ascending: false })
    .order("name");
  if (error) throw new Error(`pricing: no se pudieron leer los servicios extra (${error.code})`);
  return data.map((row) => ({
    id: row.id,
    catalogExtraId: row.catalog_extra_id,
    name: row.name,
    priceMode: row.price_mode,
    priceCents: row.price_cents,
    active: row.active,
  }));
}

/** Guarda una versión nueva de la tarifa (`save_tariff`, RF-06). Devuelve la versión creada. */
export async function saveTariff(input: TariffInput): Promise<{ ok: true; version: number } | { ok: false; error: "notAllowed" | "invalid" | "failed" }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("save_tariff", { p_tariff: { ...input } });
  if (error) {
    if (error.code === "42501") return { ok: false, error: "notAllowed" };
    // 23514: algún `check` de la tabla; 22023/22P02: dato que no encaja
    if (error.code === "23514" || error.code === "22023" || error.code === "22P02") return { ok: false, error: "invalid" };
    return { ok: false, error: "failed" };
  }
  return { ok: true, version: data };
}

/** Crea (`id` nulo) o edita un servicio extra (`save_company_extra`, RF-07). */
export async function saveCompanyExtra(
  id: string | null,
  extra: Omit<CompanyExtra, "id">,
): Promise<{ ok: true; id: string } | { ok: false; error: "nameTaken" | "invalid" | "failed" }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("save_company_extra", {
    // El generador de tipos marca los argumentos como no nulos, pero la función acepta null en estos dos
    p_id: id as string,
    p_catalog_extra_id: extra.catalogExtraId as string,
    p_name: extra.name,
    p_price_mode: extra.priceMode,
    p_price_cents: extra.priceCents,
    p_active: extra.active,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "nameTaken" };
    if (error.code === "22023" || error.code === "23514" || error.code === "42501") return { ok: false, error: "invalid" };
    return { ok: false, error: "failed" };
  }
  return { ok: true, id: data };
}
