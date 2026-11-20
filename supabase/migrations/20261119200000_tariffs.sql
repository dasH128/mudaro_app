-- Paso 5.1 · Tarifa y servicios extra de la empresa (RF-06, RF-07). Plan: docs/plan-paso-5-presupuestos.md.
--
-- Tarifa versionada: guardar cambios crea una versión nueva y la anterior no se toca, así los presupuestos enviados
-- conservan la versión con la que se calcularon (RF-06). La vigente es la de versión más alta.
-- Todas las empresas parten de una tarifa v1 con valores por defecto (P3, acordado el 19/11/2026): son solo un punto
-- de partida provisional que cada empresa cambia. Una empresa nueva recibe la suya al darse de alta.
-- Costes y márgenes son privados (RNF-03): la tarifa solo la leen los administradores de la empresa.
--
-- Servicios extra (company_extras, migración 20261118100000): aquí llegan sus escrituras, por funciones.

create type public.quote_presentation as enum ('fixed', 'hourly');

create table public.tariffs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  version integer not null check (version >= 1),

  -- Precio y coste por hora de cada operario
  operator_hour_price_cents integer not null check (operator_hour_price_cents between 0 and 100000),
  operator_hour_cost_cents integer not null check (operator_hour_cost_cents between 0 and 100000),
  km_price_cents integer not null check (km_price_cents between 0 and 10000),

  -- Suplementos fijos por cada piso sin elevador y por estacionamiento lejano (RF-06)
  no_lift_floor_surcharge_cents integer not null default 0 check (no_lift_floor_surcharge_cents between 0 and 100000),
  parking_surcharge_cents integer not null default 0 check (parking_surcharge_cents between 0 and 100000),
  minimum_service_cents integer not null default 0 check (minimum_service_cents between 0 and 10000000),

  stowage_factor numeric(4, 2) not null default 1.20 check (stowage_factor between 1 and 3),
  average_speed_kmh numeric(5, 1) not null default 50 check (average_speed_kmh between 5 and 130),
  vat_pct numeric(4, 2) not null default 23 check (vat_pct between 0 and 30),

  -- Factor de acceso (RF-33): horas de más por cada piso sin elevador y por cada 25 m de estacionamiento
  no_lift_floor_extra_pct numeric(5, 2) not null default 10 check (no_lift_floor_extra_pct between 0 and 100),
  parking_extra_pct_per_25m numeric(5, 2) not null default 5 check (parking_extra_pct_per_25m between 0 and 100),

  -- Operarios por tramos de volumen (RF-32): hasta small_max_m3, hasta medium_max_m3 y por encima
  crew_small integer not null default 2 check (crew_small between 1 and 20),
  crew_small_max_m3 numeric(6, 2) not null default 15 check (crew_small_max_m3 > 0),
  crew_medium integer not null default 3 check (crew_medium between 1 and 20),
  crew_medium_max_m3 numeric(6, 2) not null default 30 check (crew_medium_max_m3 > 0),
  crew_large integer not null default 4 check (crew_large between 1 and 20),

  -- Cómo se presenta el precio al cliente: cerrado o por hora con estimación (decisión 3 del paso 5)
  quote_presentation public.quote_presentation not null default 'fixed',
  quote_validity_days integer not null default 15 check (quote_validity_days between 1 and 90),

  valid_from timestamptz not null default now(),
  created_by uuid,

  unique (company_id, version),
  check (crew_small_max_m3 < crew_medium_max_m3)
);

create index tariffs_company_id_idx on public.tariffs (company_id);

alter table public.tariffs enable row level security;
revoke all on public.tariffs from anon, authenticated;
grant select on public.tariffs to authenticated;

-- Costes y márgenes: solo los administradores de la empresa (RNF-03).
create policy "administrators read their company tariffs"
on public.tariffs for select
to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

-- =====================================================================
-- Tarifa v1 por defecto
-- =====================================================================

-- Valores provisionales (P3), a confirmar con empresas del piloto. Referencias de mercado consultadas el 19/11/2026:
-- en Portugal se anuncian 25 a 35 €/h por equipa y 7 a 15 €/h por ayudante; mínimo de una mudanza pequeña ~120 €.
create or replace function public.insert_default_tariff(p_company_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.tariffs (
    company_id, version, operator_hour_price_cents, operator_hour_cost_cents, km_price_cents, minimum_service_cents
  ) values (p_company_id, 1, 1500, 900, 60, 12000)
  on conflict (company_id, version) do nothing;
$$;

revoke all on function public.insert_default_tariff(uuid) from public, anon, authenticated;

create or replace function public.companies_default_tariff()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.insert_default_tariff(new.id);
  return new;
end;
$$;

revoke all on function public.companies_default_tariff() from public, anon, authenticated;

create trigger companies_default_tariff
after insert on public.companies
for each row execute function public.companies_default_tariff();

-- Las empresas que ya existen
select public.insert_default_tariff(c.id) from public.companies c;

-- =====================================================================
-- save_tariff: guarda una versión nueva (RF-06)
-- =====================================================================

-- p_tariff lleva todos los campos de la tabla con su nombre en camelCase. La versión, la empresa y el autor salen de
-- la sesión. Los `check` de la tabla validan los rangos. Devuelve la versión creada.
create or replace function public.save_tariff(p_tariff jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_actor_name text;
  v_version integer;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_tariff is null or jsonb_typeof(p_tariff) <> 'object' then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

  -- Bloquea las versiones de la empresa: dos guardados a la vez no crean la misma versión.
  perform 1 from public.companies where id = v_company_id for update;
  select coalesce(max(version), 0) + 1 into v_version from public.tariffs where company_id = v_company_id;

  insert into public.tariffs (
    company_id, version,
    operator_hour_price_cents, operator_hour_cost_cents, km_price_cents,
    no_lift_floor_surcharge_cents, parking_surcharge_cents, minimum_service_cents,
    stowage_factor, average_speed_kmh, vat_pct,
    no_lift_floor_extra_pct, parking_extra_pct_per_25m,
    crew_small, crew_small_max_m3, crew_medium, crew_medium_max_m3, crew_large,
    quote_presentation, quote_validity_days, created_by
  ) values (
    v_company_id, v_version,
    (p_tariff ->> 'operatorHourPriceCents')::integer, (p_tariff ->> 'operatorHourCostCents')::integer,
    (p_tariff ->> 'kmPriceCents')::integer,
    (p_tariff ->> 'noLiftFloorSurchargeCents')::integer, (p_tariff ->> 'parkingSurchargeCents')::integer,
    (p_tariff ->> 'minimumServiceCents')::integer,
    (p_tariff ->> 'stowageFactor')::numeric, (p_tariff ->> 'averageSpeedKmh')::numeric, (p_tariff ->> 'vatPct')::numeric,
    (p_tariff ->> 'noLiftFloorExtraPct')::numeric, (p_tariff ->> 'parkingExtraPctPer25m')::numeric,
    (p_tariff ->> 'crewSmall')::integer, (p_tariff ->> 'crewSmallMaxM3')::numeric,
    (p_tariff ->> 'crewMedium')::integer, (p_tariff ->> 'crewMediumMaxM3')::numeric,
    (p_tariff ->> 'crewLarge')::integer,
    (p_tariff ->> 'quotePresentation')::public.quote_presentation, (p_tariff ->> 'quoteValidityDays')::integer,
    v_user_id
  );

  select name into v_actor_name from public.company_users where id = v_user_id;
  insert into public.audit_log (actor_id, actor_type, company_id, action, entity, entity_id, data)
  values (
    v_user_id, 'company', v_company_id, 'tariff_saved', 'tariff', v_company_id::text,
    jsonb_build_object('by', v_actor_name, 'version', v_version)
  );

  return v_version;
end;
$$;

revoke all on function public.save_tariff(jsonb) from public, anon;
grant execute on function public.save_tariff(jsonb) to authenticated;

-- =====================================================================
-- save_company_extra: crea o edita un servicio extra (RF-07)
-- =====================================================================

-- p_id nulo = servicio nuevo. Un servicio cuelga de un tipo activo del catálogo de Mudaro o, sin tipo, es propio.
-- Cambiar el precio no cambia los presupuestos ya enviados: sus líneas copian descripción y precio (paso 5.2).
-- Un nombre repetido en la empresa lanza unique_violation (23505).
create or replace function public.save_company_extra(
  p_id uuid,
  p_catalog_extra_id uuid,
  p_name text,
  p_price_mode public.price_mode,
  p_price_cents integer,
  p_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_actor_name text;
  v_extra_id uuid;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_catalog_extra_id is not null
    and not exists (select 1 from public.catalog_extras e where e.id = p_catalog_extra_id and e.active) then
    raise exception 'catalog extra not found' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.company_extras (company_id, catalog_extra_id, name, price_mode, price_cents, active)
    values (v_company_id, p_catalog_extra_id, btrim(p_name), p_price_mode, p_price_cents, coalesce(p_active, true))
    returning id into v_extra_id;
  else
    update public.company_extras
    set catalog_extra_id = p_catalog_extra_id,
        name = btrim(p_name),
        price_mode = p_price_mode,
        price_cents = p_price_cents,
        active = coalesce(p_active, active)
    where id = p_id and company_id = v_company_id
    returning id into v_extra_id;
    if v_extra_id is null then
      raise exception 'not allowed' using errcode = '42501';
    end if;
  end if;

  select name into v_actor_name from public.company_users where id = v_user_id;
  insert into public.audit_log (actor_id, actor_type, company_id, action, entity, entity_id, data)
  values (
    v_user_id, 'company', v_company_id,
    case when p_id is null then 'company_extra_created' else 'company_extra_updated' end,
    'company_extra', v_extra_id::text,
    jsonb_build_object('by', v_actor_name, 'name', btrim(p_name), 'priceCents', p_price_cents, 'active', coalesce(p_active, true))
  );

  return v_extra_id;
end;
$$;

revoke all on function public.save_company_extra(uuid, uuid, text, public.price_mode, integer, boolean) from public, anon;
grant execute on function public.save_company_extra(uuid, uuid, text, public.price_mode, integer, boolean) to authenticated;
