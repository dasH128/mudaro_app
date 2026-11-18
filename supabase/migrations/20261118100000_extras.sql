-- Servicios extra: catálogo global de tipos, servicios de cada empresa y extras marcados en el inventario
-- (RF-07, RF-24, RNF-01). Resuelve la decisión B5 del modelo (18/11/2026).
--
-- Idea: Mudaro define los tipos de servicio (catalog_extras). Cada empresa crea sus servicios con nombre y
-- precio propios, colgando de un tipo o sin tipo si es un servicio propio (company_extras). El cliente, o la
-- empresa que rellena el inventario, marca los tipos que necesita como referencia, sin cantidad
-- (inventory_extras). Cada empresa decide en el presupuesto qué servicio suyo aplica, con cantidad y precio
-- (quote_lines, paso 5).
--
-- Adelanta dos piezas de otros pasos: company_extras (paso 2) e inventory_extras (paso 4b). Las líneas
-- opcionales del presupuesto y la selección del cliente al aceptar son del paso 5 y no van aquí.
--
-- Depende de: set_updated_at(), is_platform_user(), current_company_id() (pasos 1 y 2), block_slug_change()
-- y app_locale (catalog.sql), can_read_order() e inventories (orders_tables.sql y orders_rls.sql),
-- block_submitted_inventory_changes() (orders_tables.sql).
--
-- Orden del archivo: tipos, tablas, índices, triggers, RLS, datos iniciales.

-- =====================================================================
-- Tipos
-- =====================================================================

-- Cómo cobra una empresa su servicio. m3_month es para el guarda-muebles.
-- Guion bajo, como date_flexibility (convención de enums aún abierta, B3).
create type public.price_mode as enum ('fixed', 'unit', 'hour', 'm3', 'm3_month');

-- =====================================================================
-- Tablas
-- =====================================================================

-- Tipos de servicio extra del catálogo global. Los mantiene el equipo Mudaro. Nunca se borran: se
-- desactivan, porque los servicios de las empresas y los inventarios los referencian.
create table public.catalog_extras (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Nombre del ícono Lucide.
  icon text check (icon is null or length(btrim(icon)) > 0),
  -- Posición en el paso de extras del inventario: menor aparece primero.
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una fila por idioma, como el resto del catálogo. El portugués es obligatorio.
create table public.catalog_extra_translations (
  extra_id uuid not null references public.catalog_extras (id) on delete cascade,
  locale public.app_locale not null,
  name text not null check (length(btrim(name)) > 0),
  -- Frase corta que ayuda al cliente a saber si lo necesita.
  description text check (description is null or length(btrim(description)) > 0),
  primary key (extra_id, locale)
);

-- Servicios de cada empresa (RF-07). Cuelgan de un tipo del catálogo o, sin tipo, son servicios propios
-- que la empresa solo añade al presupuestar (el cliente no los ve en el inventario).
create table public.company_extras (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  catalog_extra_id uuid references public.catalog_extras (id) on delete restrict,
  -- Nombre propio de la empresa ("Embalagem premium"). Dato de la empresa: no se traduce.
  name text not null check (length(btrim(name)) between 1 and 120),
  price_mode public.price_mode not null,
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name),
  -- Destino de una clave compuesta desde quote_lines (paso 5): el servicio debe ser de la empresa del presupuesto.
  unique (id, company_id)
);

-- Tipos de extra marcados en una versión del inventario (RF-24). Son una referencia para las empresas,
-- sin cantidad ni precio: cada empresa los traduce a sus servicios al presupuestar.
create table public.inventory_extras (
  inventory_id uuid not null,
  -- Repetido para la clave compuesta y para la RLS por pedido, como en inventory_addresses.
  order_id uuid not null,
  catalog_extra_id uuid not null references public.catalog_extras (id) on delete restrict,
  -- Detalle libre del cliente ("piano vertical, 2.º andar sem elevador").
  note text check (note is null or length(btrim(note)) between 1 and 500),
  created_at timestamptz not null default now(),
  primary key (inventory_id, catalog_extra_id),
  foreign key (inventory_id, order_id) references public.inventories (id, order_id) on delete cascade
);

-- =====================================================================
-- Índices
-- =====================================================================

create index company_extras_company_id_idx on public.company_extras (company_id);
create index company_extras_catalog_extra_id_idx on public.company_extras (catalog_extra_id);
create index inventory_extras_order_id_idx on public.inventory_extras (order_id);
create index inventory_extras_catalog_extra_id_idx on public.inventory_extras (catalog_extra_id);

-- =====================================================================
-- Triggers
-- =====================================================================

create trigger catalog_extras_set_updated_at
before update on public.catalog_extras
for each row execute function public.set_updated_at();

create trigger catalog_extras_block_slug_change
before update on public.catalog_extras
for each row execute function public.block_slug_change();

create trigger company_extras_set_updated_at
before update on public.company_extras
for each row execute function public.set_updated_at();

-- Una versión enviada del inventario no cambia, tampoco sus extras (A10).
create trigger inventory_extras_block_submitted_changes
before insert or update or delete on public.inventory_extras
for each row execute function public.block_submitted_inventory_changes();

-- =====================================================================
-- Seguridad (RLS)
-- =====================================================================

alter table public.catalog_extras enable row level security;
alter table public.catalog_extra_translations enable row level security;
alter table public.company_extras enable row level security;
alter table public.inventory_extras enable row level security;

-- Solo lectura desde la app. Las escrituras llegan con sus pantallas: el catálogo por Edge Function del
-- panel interno (como catalog_items), los servicios de la empresa y los extras del inventario por funciones.
revoke all on
  public.catalog_extras, public.catalog_extra_translations, public.company_extras, public.inventory_extras
from anon, authenticated;
grant select on
  public.catalog_extras, public.catalog_extra_translations, public.company_extras, public.inventory_extras
to authenticated;

-- Las empresas leen los tipos activos; el equipo Mudaro los ve todos para poder reactivarlos.
create policy "authenticated read active catalog extras"
on public.catalog_extras for select
to authenticated
using (active or (select public.is_platform_user()));

-- Visibles si lo es su tipo: un tipo inactivo no filtra sus nombres.
create policy "authenticated read visible catalog extra translations"
on public.catalog_extra_translations for select
to authenticated
using (exists (select 1 from public.catalog_extras e where e.id = extra_id));

-- Cada empresa lee solo sus servicios (RNF-01). Precio incluido: no es un coste interno (RNF-03).
create policy "members read their company extras"
on public.company_extras for select
to authenticated
using (company_id = (select public.current_company_id()));

-- Como el resto del inventario: lo lee una empresa que tenga un envío en el pedido.
create policy "administrators read inventory extras of their orders"
on public.inventory_extras for select
to authenticated
using (public.can_read_order(order_id));

-- =====================================================================
-- Datos iniciales: tipos del catálogo para el piloto
-- (provisionales; el equipo Mudaro los ajusta desde el panel interno cuando exista la pantalla)
-- =====================================================================

with seed (slug, icon, sort_order, pt_name, pt_description, es_name, es_description, en_name, en_description) as (
  values
    ('packing', 'package', 10,
      'Embalagem', 'Caixas, papel e proteção para loiça, livros e objetos frágeis.',
      'Embalaje', 'Cajas, papel y protección para vajilla, libros y objetos frágiles.',
      'Packing', 'Boxes, paper and protection for dishes, books and fragile items.'),
    ('unpacking', 'package-open', 20,
      'Desembalagem', 'Abrir as caixas e arrumar no destino.',
      'Desembalaje', 'Abrir las cajas y colocar en el destino.',
      'Unpacking', 'Opening the boxes and putting things away at the destination.'),
    ('furniture-assembly', 'wrench', 30,
      'Desmontagem e montagem de móveis', 'Camas, roupeiros e mesas que não passam inteiros.',
      'Desmontaje y montaje de muebles', 'Camas, armarios y mesas que no pasan enteros.',
      'Furniture disassembly and assembly', 'Beds, wardrobes and tables that do not fit through whole.'),
    ('appliance-installation', 'plug', 40,
      'Instalação de eletrodomésticos', 'Ligar máquina de lavar, frigorífico ou fogão no destino.',
      'Instalación de electrodomésticos', 'Conectar lavadora, frigorífico o cocina en el destino.',
      'Appliance installation', 'Connecting the washing machine, fridge or cooker at the destination.'),
    ('piano-moving', 'piano', 50,
      'Transporte de piano', 'Piano vertical ou de cauda, com equipamento próprio.',
      'Transporte de piano', 'Piano vertical o de cola, con equipo especial.',
      'Piano moving', 'Upright or grand piano, with special equipment.'),
    ('outdoor-lift', 'arrow-up-from-line', 60,
      'Elevador exterior', 'Monta-cargas pela janela quando as escadas ou o elevador não chegam.',
      'Elevador exterior', 'Montacargas por la ventana cuando la escalera o el ascensor no bastan.',
      'External lift', 'Furniture lift through the window when stairs or the lift are not enough.'),
    ('storage', 'warehouse', 70,
      'Guarda-móveis', 'Guardar os bens durante dias ou meses.',
      'Guardamuebles', 'Guardar los bienes durante días o meses.',
      'Storage', 'Keeping belongings for days or months.'),
    ('junk-removal', 'trash-2', 80,
      'Retirada de monos', 'Levar móveis e objetos que não vão para a casa nova.',
      'Retirada de trastos', 'Llevarse muebles y objetos que no van a la casa nueva.',
      'Junk removal', 'Taking away furniture and items that are not going to the new home.'),
    ('cleaning', 'sparkles', 90,
      'Limpeza pós-mudança', 'Limpeza da casa antiga ou da nova depois da mudança.',
      'Limpieza tras la mudanza', 'Limpieza de la casa antigua o de la nueva después de la mudanza.',
      'Post-move cleaning', 'Cleaning the old or the new home after the move.')
),
inserted as (
  insert into public.catalog_extras (slug, icon, sort_order)
  select slug, icon, sort_order from seed
  returning id, slug
)
insert into public.catalog_extra_translations (extra_id, locale, name, description)
select i.id, t.locale::public.app_locale, t.name, t.description
from inserted i
join seed s on s.slug = i.slug
cross join lateral (
  values ('pt', s.pt_name, s.pt_description), ('es', s.es_name, s.es_description), ('en', s.en_name, s.en_description)
) as t (locale, name, description);
