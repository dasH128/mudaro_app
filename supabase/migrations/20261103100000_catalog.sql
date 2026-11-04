-- Paso 3 · Catálogo global de objetos (RF-10, RF-11, RF-12, RNF-01, RNF-08).
--
-- Catálogo de la plataforma: no tiene company_id. Lo mantiene el equipo Mudaro desde apps/admin y lo leen
-- todas las empresas. Divisão (room) = estancia de la casa; categoría = tipo de objeto.
-- El prefijo catalog_ evita el choque con las divisões por solicitud del paso 4.
--
-- Depende de: set_updated_at() y is_platform_user() (platform.sql), audit_log (audit_log.sql).
-- Las escrituras no tienen política: pasan por Edge Functions con la clave de servicio, que validan el rol
-- de plataforma y registran el evento en audit_log (actor_type 'platform', company_id null, entity 'catalog_item',
-- 'catalog_room' o 'catalog_category'), igual que create-company.
--
-- Orden del archivo: extensiones, tipos, funciones, tablas, índices, triggers, RLS, funciones de consulta.

-- =====================================================================
-- Extensiones (en Supabase viven en el esquema "extensions")
-- =====================================================================

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- =====================================================================
-- Tipos
-- =====================================================================

create type public.app_locale as enum ('pt', 'es', 'en');
create type public.handling_flag as enum ('fragile', 'disassembly', 'extra_crew');

-- =====================================================================
-- Funciones auxiliares
-- =====================================================================

-- unaccent no es immutable; este envoltorio permite usarlo en índices.
create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

-- Evita valores repetidos en arrays como handling_flags.
create or replace function public.array_has_no_duplicates(anyarray)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select count(*) = count(distinct x) from unnest($1) as t(x)
$$;

-- El slug no cambia después de crearse (el formulario lo muestra como solo lectura).
create or replace function public.block_slug_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.slug is distinct from old.slug then
    raise exception 'slug is immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- =====================================================================
-- Tablas
-- =====================================================================

-- Categorías: qué es el objeto.
create table public.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Nombre del ícono Lucide.
  icon text check (icon is null or length(btrim(icon)) > 0),
  -- Posición en el inventario del cliente: menor aparece primero.
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una fila por idioma. Una traducción que falta es una fila ausente.
-- El portugués es obligatorio: lo exige la Edge Function que escribe (el fallback de búsqueda depende de él).
create table public.catalog_category_translations (
  category_id uuid not null references public.catalog_categories (id) on delete cascade,
  locale public.app_locale not null,
  name text not null check (length(btrim(name)) > 0),
  description text,
  primary key (category_id, locale)
);

-- Divisões: dónde está el objeto (recorrido del cliente, RF-20).
create table public.catalog_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  icon text check (icon is null or length(btrim(icon)) > 0),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catalog_room_translations (
  room_id uuid not null references public.catalog_rooms (id) on delete cascade,
  locale public.app_locale not null,
  name text not null check (length(btrim(name)) > 0),
  primary key (room_id, locale)
);

-- Objetos del catálogo (RF-10). Nunca se borran: se desactivan, porque las líneas de inventario los referencian.
create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Una sola categoría. restrict: una categoría con objetos se desactiva, no se borra.
  category_id uuid not null references public.catalog_categories (id) on delete restrict,
  -- Valores por defecto del catálogo. Cada línea de inventario los copia al crearse.
  volume_m3 numeric(6,3) not null check (volume_m3 > 0 and volume_m3 <= 100),
  max_dimension_cm integer check (max_dimension_cm is null or max_dimension_cm > 0),
  weight_kg numeric(7,2) check (weight_kg is null or (weight_kg > 0 and weight_kg <= 5000)),
  handling_minutes integer not null default 5 check (handling_minutes >= 0 and handling_minutes <= 600),
  -- Cuidados por defecto; cada inventario los ajusta después.
  handling_flags public.handling_flag[] not null default '{}'
    check (public.array_has_no_duplicates(handling_flags)),
  icon text check (icon is null or length(btrim(icon)) > 0),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catalog_item_translations (
  item_id uuid not null references public.catalog_items (id) on delete cascade,
  locale public.app_locale not null,
  name text not null check (length(btrim(name)) > 0),
  -- Sinónimos separados por comas; entran en la búsqueda (RF-11).
  synonyms text,
  primary key (item_id, locale)
);

-- Divisões donde puede aparecer cada objeto.
create table public.catalog_item_rooms (
  item_id uuid not null references public.catalog_items (id) on delete cascade,
  room_id uuid not null references public.catalog_rooms (id) on delete restrict,
  primary key (item_id, room_id)
);

-- =====================================================================
-- Índices
-- =====================================================================

create index catalog_items_category_id_idx on public.catalog_items (category_id);
create index catalog_item_rooms_room_id_idx on public.catalog_item_rooms (room_id);

-- Búsqueda sin acentos en cualquier idioma (RF-11).
create index catalog_item_translations_search_idx
on public.catalog_item_translations
using gin (public.f_unaccent(lower(name || ' ' || coalesce(synonyms, ''))) extensions.gin_trgm_ops);

-- =====================================================================
-- Triggers
-- =====================================================================

create trigger catalog_categories_set_updated_at
before update on public.catalog_categories
for each row execute function public.set_updated_at();

create trigger catalog_rooms_set_updated_at
before update on public.catalog_rooms
for each row execute function public.set_updated_at();

create trigger catalog_items_set_updated_at
before update on public.catalog_items
for each row execute function public.set_updated_at();

create trigger catalog_categories_block_slug_change
before update on public.catalog_categories
for each row execute function public.block_slug_change();

create trigger catalog_rooms_block_slug_change
before update on public.catalog_rooms
for each row execute function public.block_slug_change();

create trigger catalog_items_block_slug_change
before update on public.catalog_items
for each row execute function public.block_slug_change();

-- =====================================================================
-- Seguridad (RLS)
-- =====================================================================

alter table public.catalog_categories enable row level security;
alter table public.catalog_category_translations enable row level security;
alter table public.catalog_rooms enable row level security;
alter table public.catalog_room_translations enable row level security;
alter table public.catalog_items enable row level security;
alter table public.catalog_item_translations enable row level security;
alter table public.catalog_item_rooms enable row level security;

-- Solo lectura desde la app: las altas y los cambios pasan por Edge Functions.
-- El cliente final no entra aquí: lee a través de la Edge Function del enlace.
revoke all on
  public.catalog_categories, public.catalog_category_translations,
  public.catalog_rooms, public.catalog_room_translations,
  public.catalog_items, public.catalog_item_translations, public.catalog_item_rooms
from anon, authenticated;
grant select on
  public.catalog_categories, public.catalog_category_translations,
  public.catalog_rooms, public.catalog_room_translations,
  public.catalog_items, public.catalog_item_translations, public.catalog_item_rooms
to authenticated;

-- Las empresas leen solo lo activo; el equipo Mudaro lo ve todo para poder reactivarlo.
create policy "authenticated read active catalog categories"
on public.catalog_categories for select
to authenticated
using (active or (select public.is_platform_user()));

create policy "authenticated read active catalog rooms"
on public.catalog_rooms for select
to authenticated
using (active or (select public.is_platform_user()));

create policy "authenticated read active catalog items"
on public.catalog_items for select
to authenticated
using (active or (select public.is_platform_user()));

-- Traducciones y relaciones: visibles si lo es su padre. El exists pasa por la RLS del padre,
-- así que un objeto inactivo no filtra sus nombres a las empresas.
create policy "authenticated read visible catalog category translations"
on public.catalog_category_translations for select
to authenticated
using (exists (select 1 from public.catalog_categories c where c.id = category_id));

create policy "authenticated read visible catalog room translations"
on public.catalog_room_translations for select
to authenticated
using (exists (select 1 from public.catalog_rooms r where r.id = room_id));

create policy "authenticated read visible catalog item translations"
on public.catalog_item_translations for select
to authenticated
using (exists (select 1 from public.catalog_items i where i.id = item_id));

create policy "authenticated read visible catalog item rooms"
on public.catalog_item_rooms for select
to authenticated
using (exists (select 1 from public.catalog_items i where i.id = item_id));

-- =====================================================================
-- Funciones de consulta
-- (van después de las tablas: una función SQL comprueba sus tablas al crearse)
-- =====================================================================

-- Búsqueda (RF-11): busca en los 3 idiomas y devuelve el nombre en el idioma pedido,
-- o en portugués si falta la traducción. security invoker: respeta la RLS de quien llama.
create or replace function public.search_catalog_items(q text, lang public.app_locale default 'pt')
returns table (item_id uuid, name text, category_id uuid, volume_m3 numeric, handling_flags public.handling_flag[])
language sql
stable
security invoker
set search_path = ''
as $$
  with matches as (
    select distinct t.item_id
    from public.catalog_item_translations t
    where public.f_unaccent(lower(t.name || ' ' || coalesce(t.synonyms, '')))
          -- Se escapan \ % _ para que el texto buscado se tome literal.
          like '%' || replace(replace(replace(public.f_unaccent(lower(btrim(q))), '\', '\\'), '%', '\%'), '_', '\_') || '%'
          escape '\'
  )
  select i.id,
         coalesce(tl.name, tp.name),
         i.category_id,
         i.volume_m3,
         i.handling_flags
  from matches m
  join public.catalog_items i on i.id = m.item_id and i.active
  left join public.catalog_item_translations tl on tl.item_id = i.id and tl.locale = lang
  left join public.catalog_item_translations tp on tp.item_id = i.id and tp.locale = 'pt'
  order by i.sort_order, coalesce(tl.name, tp.name)
  limit 50
$$;

revoke execute on function public.search_catalog_items(text, public.app_locale) from public, anon;
grant execute on function public.search_catalog_items(text, public.app_locale) to authenticated;
