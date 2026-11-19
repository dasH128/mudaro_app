-- Paso 4b · Líneas del inventario y correcciones de cada empresa (RF-20, RF-21, RF-27, RF-36, RF-37).
--
-- Modelo: docs/diagram/mudaro-model.dbml. Decisiones: docs/plan-modelo-bd.md ("Inventario por capas").
-- Dos capas separadas (A2, 18/11/2026):
--   1. inventory_lines: lo que declara el cliente (o la empresa cuando rellena ella, RF-19). Pertenece al
--      pedido y es igual para todas las empresas con envío en ese pedido.
--   2. inventory_line_adjustments: lo que corrige cada empresa sobre una línea. Privado de esa empresa:
--      la corrección de una no cambia los números de otra.
-- El ajuste propio de un objeto del catálogo (RF-09, company_items) no se referencia desde la línea:
-- cada empresa lo aplica al calcular.
--
-- Escrituras: sin políticas de escritura. Todo pasa por las funciones de 20261118200200_inventory_functions.sql.

-- =====================================================================
-- Líneas del inventario (capa 1)
-- =====================================================================

create table public.inventory_lines (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null,
  -- Repetido para la clave compuesta con inventories y la RLS por pedido, como en inventory_addresses.
  order_id uuid not null,
  -- Objeto del catálogo o, si es nulo, objeto libre con descripción (RF-21).
  catalog_item_id uuid references public.catalog_items (id) on delete restrict,
  description text check (description is null or length(btrim(description)) between 1 and 200),
  -- Habitación en texto libre: el recorrido usa las del catálogo, pero el cliente puede escribir otra.
  room text check (room is null or length(btrim(room)) between 1 and 100),
  quantity integer not null default 1 check (quantity between 1 and 999),
  -- Valores base por unidad. En un objeto del catálogo se copian del catálogo al crear la línea, así el
  -- anexo del presupuesto muestra la versión exacta aunque el catálogo cambie después (RF-39).
  -- Un objeto libre sin medidas deja el volumen vacío y queda para revisión (RF-21, RF-36).
  unit_volume_m3 numeric(6,3) check (unit_volume_m3 is null or (unit_volume_m3 > 0 and unit_volume_m3 <= 100)),
  unit_weight_kg numeric(7,2) check (unit_weight_kg is null or (unit_weight_kg > 0 and unit_weight_kg <= 5000)),
  unit_minutes integer not null default 5 check (unit_minutes between 0 and 600),
  handling_flags public.handling_flag[] not null default '{}'
    check (public.array_has_no_duplicates(handling_flags)),
  -- Rutas de Storage. El bucket y sus políticas llegan más adelante (fuera del 4b).
  photos text[] not null default '{}',
  -- Objeto libre sin volumen: la empresa debe revisarlo antes de presupuestar (RF-21, RF-36).
  needs_review boolean generated always as (unit_volume_m3 is null) stored,
  -- Línea de la versión anterior de la que viene esta. Nula en la versión 1 y en las líneas nuevas.
  previous_line_id uuid,
  -- Lo marca submit_inventory(): la base (objeto, cantidad, volumen, peso, minutos o cuidados) es distinta
  -- de la línea anterior, o la línea es nueva en esta versión (RF-27).
  base_changed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Destino de las claves compuestas de previous_line_id y de inventory_line_adjustments.
  unique (id, order_id),
  foreign key (inventory_id, order_id) references public.inventories (id, order_id) on delete cascade,
  -- La línea anterior es del mismo pedido.
  foreign key (previous_line_id, order_id) references public.inventory_lines (id, order_id),
  check (catalog_item_id is not null or description is not null),
  -- Un objeto del catálogo siempre tiene volumen: solo el objeto libre puede quedar para revisión.
  check (catalog_item_id is null or unit_volume_m3 is not null)
);

create index inventory_lines_inventory_id_idx on public.inventory_lines (inventory_id);
create index inventory_lines_order_id_idx on public.inventory_lines (order_id);
create index inventory_lines_catalog_item_id_idx on public.inventory_lines (catalog_item_id);
create index inventory_lines_previous_line_id_idx on public.inventory_lines (previous_line_id);

create trigger inventory_lines_set_updated_at
before update on public.inventory_lines
for each row execute function public.set_updated_at();

-- Una versión enviada no cambia, tampoco sus líneas (A10). La función ya la usan inventory_addresses
-- e inventory_extras: también impide mover una línea a otra versión.
create trigger inventory_lines_block_submitted_changes
before insert or update or delete on public.inventory_lines
for each row execute function public.block_submitted_inventory_changes();

-- =====================================================================
-- Correcciones de cada empresa (capa 2)
-- =====================================================================

-- Valor final que una empresa da a una línea. El valor sugerido es el de la línea, que no cambia una vez
-- enviada la versión, así que se guardan los dos (RF-37). Un campo nulo significa "sin corrección".
-- Los ajustes de precio y horas del presupuesto van en quote_lines (paso 5).
create table public.inventory_line_adjustments (
  inventory_line_id uuid not null,
  order_id uuid not null,
  company_id uuid not null,
  unit_volume_m3 numeric(6,3) check (unit_volume_m3 is null or (unit_volume_m3 > 0 and unit_volume_m3 <= 100)),
  unit_weight_kg numeric(7,2) check (unit_weight_kg is null or (unit_weight_kg > 0 and unit_weight_kg <= 5000)),
  unit_minutes integer check (unit_minutes is null or unit_minutes between 0 and 600),
  updated_by uuid references public.company_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (inventory_line_id, company_id),
  foreign key (inventory_line_id, order_id) references public.inventory_lines (id, order_id) on delete cascade,
  -- La empresa tiene un envío en el pedido de la línea (shipments tiene unique (order_id, company_id)).
  foreign key (order_id, company_id) references public.shipments (order_id, company_id) on delete cascade,
  check (unit_volume_m3 is not null or unit_weight_kg is not null or unit_minutes is not null)
);

create index inventory_line_adjustments_order_id_company_id_idx
on public.inventory_line_adjustments (order_id, company_id);
create index inventory_line_adjustments_company_id_idx on public.inventory_line_adjustments (company_id);

create trigger inventory_line_adjustments_set_updated_at
before update on public.inventory_line_adjustments
for each row execute function public.set_updated_at();
