-- Paso 4a · Pedidos y envíos: tablas, restricciones y triggers (RF-13, RF-14, RF-17, RF-69, RNF-01, RNF-08).
--
-- Modelo: docs/diagram/mudaro-model.dbml. Decisiones: docs/plan-modelo-bd.md ("Pedido y envío").
-- orders = la mudanza. shipments = el pedido enviado a una empresa. En el MVP hay un envío por pedido.
-- La dirección (texto, coordenadas y accesos) vive por versión del inventario en inventory_addresses (A1);
-- addresses solo guarda los "huecos" del pedido (origen, paradas, destino).
-- Las líneas y los extras del inventario, y el enlace con token, llegan en el paso 4b.
--
-- Escrituras: ninguna tabla tiene políticas de escritura. Todo pasa por create_order() y cancel_order()
-- (20261109100200_orders_functions.sql), que son security definer y sacan empresa y actor de la sesión.
-- Enums con guion bajo; la app traduce a sus códigos en infrastructure.

-- =====================================================================
-- Tipos
-- =====================================================================

create type public.client_type as enum ('private', 'company');

-- Ciclo de vida del envío. cancelled no se reactiva (trigger shipments_guard_status).
create type public.shipment_status as enum (
  'new', 'awaiting_inventory', 'inventory_received', 'quoted', 'won', 'lost', 'cancelled'
);

-- Qué ocurrió en un envío (pestaña de historial).
create type public.shipment_event_kind as enum (
  'created', 'link_shared', 'link_resent', 'inventory_submitted', 'quote_sent', 'won', 'lost', 'cancelled', 'note_added'
);

-- Margen de la fecha aproximada. month = el cliente solo sabe el mes.
create type public.date_flexibility as enum ('exact', 'two_days', 'one_week', 'month');

create type public.address_role as enum ('origin', 'destination', 'stop');

create type public.lift_size as enum ('none', 'small', 'large');

-- Quién rellena una versión del inventario: el cliente por el enlace (RF-15) o la empresa (RF-19).
create type public.filled_by as enum ('client', 'company');

-- =====================================================================
-- Clientes (ficha privada de cada empresa, RF-14)
-- =====================================================================

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 200),
  -- Normalizado: +351 y 9 dígitos. Es la clave para reutilizar la ficha (RF-14).
  phone text not null check (phone ~ '^\+351[0-9]{9}$'),
  email text check (email is null or length(btrim(email)) between 3 and 320),
  tax_id text check (tax_id is null or length(btrim(tax_id)) > 0),
  type public.client_type not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, phone),
  -- Destino de la clave compuesta de shipments: la ficha debe ser de la empresa del envío.
  unique (id, company_id)
);

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

-- =====================================================================
-- Pedidos
-- =====================================================================

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Dueña del pedido mientras no haya cuentas de cliente. La RLS no usa esta columna: pasa por shipments.
  created_by_company_id uuid not null references public.companies (id) on delete restrict,
  -- Contacto declarado. La ficha de cada empresa es shipments.client_id.
  contact_name text not null check (length(btrim(contact_name)) between 1 and 200),
  contact_phone text not null check (contact_phone ~ '^\+351[0-9]{9}$'),
  desired_date date not null,
  date_flexibility public.date_flexibility not null default 'exact',
  contact_source text check (contact_source in ('phone', 'whatsapp', 'referral', 'website', 'other')),
  -- Validez elegida al crear el pedido para el enlace del cliente (RF-15). El enlace se genera en el paso 4b.
  -- Nula cuando la empresa rellena el inventario (RF-19).
  link_validity_days smallint check (link_validity_days is null or link_validity_days between 1 and 90),
  -- Solo el hash del token (RNF-02). Nulos hasta que se comparte el enlace por primera vez.
  token_hash text unique,
  token_expires_at timestamptz,
  -- Cancelación (RF-69). Solo la rellena cancel_order().
  cancelled_at timestamptz,
  cancellation_reason text check (cancellation_reason is null or length(btrim(cancellation_reason)) between 1 and 500),
  cancelled_by_type text check (cancelled_by_type in ('company', 'client')),
  cancelled_by_id uuid references public.company_users (id) on delete set null,
  created_at timestamptz not null default now(),
  check ((token_hash is null) = (token_expires_at is null)),
  check (
    (cancelled_at is null and cancellation_reason is null and cancelled_by_type is null and cancelled_by_id is null)
    or (cancelled_at is not null and cancelled_by_type is not null)
  )
);

create index orders_created_by_company_id_idx on public.orders (created_by_company_id);

-- =====================================================================
-- Envíos
-- =====================================================================

-- Contador del número visible de cada empresa (MD-0836 lo arma la interfaz). Sin saltos y sin reutilizar.
-- Interno: solo lo usa create_order(), con un bloqueo de fila por empresa.
create table public.shipment_counters (
  company_id uuid primary key references public.companies (id) on delete cascade,
  last_number integer not null check (last_number >= 0)
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete restrict,
  order_id uuid not null references public.orders (id) on delete restrict,
  -- Número visible para la empresa. Pedido y envío comparten este número (RF-17). El cliente no lo ve.
  number integer not null check (number > 0),
  client_id uuid not null,
  status public.shipment_status not null default 'new',
  lost_reason text check (lost_reason is null or length(btrim(lost_reason)) between 1 and 500),
  -- Lo actualiza el trigger shipments_guard_status en cada cambio de estado (RF-18, cifras del mes).
  status_changed_at timestamptz not null default now(),
  -- Lo actualiza el trigger de shipment_events: "sin novedades hace X días" y orden de la lista.
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (order_id, company_id),
  unique (company_id, number),
  -- Destino de las claves compuestas de notas e historial.
  unique (id, company_id),
  -- La ficha del cliente debe ser de la misma empresa que el envío.
  foreign key (client_id, company_id) references public.clients (id, company_id) on delete restrict,
  check (status = 'lost' or lost_reason is null)
);

-- A7: un envío por pedido en el MVP. Se quita al abrir varias empresas por pedido.
create unique index shipments_one_per_order_idx on public.shipments (order_id);

create index shipments_client_id_idx on public.shipments (client_id);
create index shipments_company_id_status_idx on public.shipments (company_id, status);

-- Un envío cancelado no se reactiva (RF-69) y cada cambio de estado deja su fecha.
create or replace function public.shipments_guard_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if old.status = 'cancelled' then
      raise exception 'a cancelled shipment cannot be reactivated' using errcode = '23514';
    end if;
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger shipments_guard_status
before update on public.shipments
for each row execute function public.shipments_guard_status();

-- =====================================================================
-- Notas e historial del envío
-- =====================================================================

-- Notas internas de la empresa. Editables y borrables (RGPD). Solo las lee el administrador (B4).
create table public.shipment_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  shipment_id uuid not null,
  author_id uuid references public.company_users (id) on delete set null,
  body text not null check (length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A6: la nota es de la misma empresa que su envío.
  foreign key (shipment_id, company_id) references public.shipments (id, company_id) on delete cascade
);

create index shipment_notes_shipment_id_idx on public.shipment_notes (shipment_id);

create trigger shipment_notes_set_updated_at
before update on public.shipment_notes
for each row execute function public.set_updated_at();

-- Historial: solo se inserta desde las funciones que hacen el cambio. Inmutable (A8).
create table public.shipment_events (
  id bigint generated always as identity primary key,
  company_id uuid not null,
  shipment_id uuid not null,
  kind public.shipment_event_kind not null,
  actor_type text not null check (actor_type in ('company', 'client', 'system')),
  -- Sin clave foránea, como audit_log: el historial sobrevive a la cuenta y no se puede actualizar.
  actor_id uuid,
  -- note_added guarda solo note_id, nunca el texto de la nota.
  data jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  -- A6: el evento es de la misma empresa que su envío.
  foreign key (shipment_id, company_id) references public.shipments (id, company_id) on delete restrict
);

create index shipment_events_shipment_id_occurred_at_idx
on public.shipment_events (shipment_id, occurred_at desc);

create or replace function public.block_shipment_events_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'shipment_events is immutable (%)', tg_op;
end;
$$;

create trigger shipment_events_block_update_delete
before update or delete on public.shipment_events
for each row execute function public.block_shipment_events_changes();

create trigger shipment_events_block_truncate
before truncate on public.shipment_events
for each statement execute function public.block_shipment_events_changes();

-- Cada evento mueve la última actividad del envío.
create or replace function public.shipment_events_touch_activity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.shipments
  set last_activity_at = greatest(last_activity_at, new.occurred_at)
  where id = new.shipment_id;
  return null;
end;
$$;

create trigger shipment_events_touch_activity
after insert on public.shipment_events
for each row execute function public.shipment_events_touch_activity();

-- =====================================================================
-- Direcciones e inventario (versión del pedido)
-- =====================================================================

-- Huecos del pedido: qué función cumple cada dirección y en qué orden. El texto y los accesos van por versión.
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  role public.address_role not null,
  sort_order integer not null check (sort_order >= 0),
  unique (order_id, sort_order),
  -- Destino de la clave compuesta de inventory_addresses.
  unique (id, order_id)
);

-- Un solo origen y un solo destino por pedido.
create unique index addresses_one_origin_idx on public.addresses (order_id) where role = 'origin';
create unique index addresses_one_destination_idx on public.addresses (order_id) where role = 'destination';

-- Versión del inventario. Sin submitted_at es el borrador: se edita en sitio (A10).
-- Con submitted_at es una versión cerrada: no se edita ni se borra.
create table public.inventories (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  version integer not null check (version > 0),
  filled_by public.filled_by not null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, version),
  unique (id, order_id)
);

-- A10: un solo borrador por pedido.
create unique index inventories_one_draft_idx on public.inventories (order_id) where submitted_at is null;

create trigger inventories_set_updated_at
before update on public.inventories
for each row execute function public.set_updated_at();

-- Datos de cada dirección en una versión: texto, coordenadas y accesos (A1, RF-23, RF-27).
create table public.inventory_addresses (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null,
  -- Repetido para que las dos claves compuestas garanticen que versión y hueco son del mismo pedido.
  order_id uuid not null,
  address_id uuid not null,
  address text not null check (length(btrim(address)) between 1 and 300),
  lat double precision check (lat is null or lat between -90 and 90),
  lng double precision check (lng is null or lng between -180 and 180),
  floor integer not null default 0 check (floor between -5 and 99),
  lift public.lift_size not null default 'none',
  narrow_stairs boolean not null default false,
  parking_distance_m integer not null default 0 check (parking_distance_m between 0 and 10000),
  needs_permit boolean not null default false,
  notes text check (notes is null or length(btrim(notes)) between 1 and 1000),
  unique (inventory_id, address_id),
  foreign key (inventory_id, order_id) references public.inventories (id, order_id) on delete cascade,
  foreign key (address_id, order_id) references public.addresses (id, order_id) on delete cascade,
  check ((lat is null) = (lng is null))
);

create index inventory_addresses_order_id_idx on public.inventory_addresses (order_id);
create index inventory_addresses_address_id_idx on public.inventory_addresses (address_id);

-- Una versión enviada es inmutable: ni ella ni sus direcciones cambian. Cambiarla abre un borrador nuevo (A10).
create or replace function public.block_submitted_inventory_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_inventory_id uuid;
begin
  if tg_table_name = 'inventories' then
    if old.submitted_at is not null then
      raise exception 'a submitted inventory version cannot change' using errcode = '23514';
    end if;
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  -- inventory_addresses: la fila no puede cambiar de versión, y la versión debe seguir en borrador.
  if tg_op = 'UPDATE' and new.inventory_id is distinct from old.inventory_id then
    raise exception 'an inventory address cannot move to another version' using errcode = '23514';
  end if;
  v_inventory_id := case when tg_op = 'DELETE' then old.inventory_id else new.inventory_id end;

  if exists (
    select 1 from public.inventories i where i.id = v_inventory_id and i.submitted_at is not null
  ) then
    raise exception 'a submitted inventory version cannot change' using errcode = '23514';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger inventories_block_submitted_changes
before update or delete on public.inventories
for each row execute function public.block_submitted_inventory_changes();

create trigger inventory_addresses_block_submitted_changes
before insert or update or delete on public.inventory_addresses
for each row execute function public.block_submitted_inventory_changes();
