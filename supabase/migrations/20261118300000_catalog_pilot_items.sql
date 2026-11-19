-- Catálogo del piloto: objetos que usa la pantalla Inventário de apps/company (RF-10, RF-20).
--
-- Hasta ahora la pantalla usaba 27 objetos de ejemplo que no existían en la base de datos, y las líneas del
-- inventario (paso 4b) solo pueden apuntar al catálogo real. Esta migración añade la división y las categorías
-- que faltaban y los 22 objetos de ejemplo que no tenían equivalente. Los 5 objetos que ya existían
-- (sofa-3-seater, dining-table, double-bed-frame, wardrobe-2-door, fridge-freezer) se quedan como estaban.
--
-- Valores provisionales: el equipo Mudaro los ajusta desde el panel interno cuando exista la pantalla.
-- Peso sin dato y minutos de manipulación por defecto (5), como los objetos existentes.

-- =====================================================================
-- División "Caixas"
-- =====================================================================

with seed (slug, icon, sort_order, pt_name, es_name, en_name) as (
  values ('boxes', 'package', 60, 'Caixas', 'Cajas', 'Boxes')
),
inserted as (
  insert into public.catalog_rooms (slug, icon, sort_order)
  select slug, icon, sort_order from seed
  returning id, slug
)
insert into public.catalog_room_translations (room_id, locale, name)
select i.id, t.locale::public.app_locale, t.name
from inserted i
join seed s on s.slug = i.slug
cross join lateral (values ('pt', s.pt_name), ('es', s.es_name), ('en', s.en_name)) as t (locale, name);

-- =====================================================================
-- Categorías "Caixas" y "Decoração e eletrónica"
-- =====================================================================

with seed (slug, icon, sort_order, pt_name, es_name, en_name) as (
  values
    ('boxes', 'package', 60, 'Caixas', 'Cajas', 'Boxes'),
    ('decor', 'lamp', 70, 'Decoração e eletrónica', 'Decoración y electrónica', 'Decor and electronics')
),
inserted as (
  insert into public.catalog_categories (slug, icon, sort_order)
  select slug, icon, sort_order from seed
  returning id, slug
)
insert into public.catalog_category_translations (category_id, locale, name)
select i.id, t.locale::public.app_locale, t.name
from inserted i
join seed s on s.slug = i.slug
cross join lateral (values ('pt', s.pt_name), ('es', s.es_name), ('en', s.en_name)) as t (locale, name);

-- =====================================================================
-- Objetos
-- =====================================================================

-- rooms: divisiones donde aparece el objeto, separadas por comas (slugs de catalog_rooms).
with seed (slug, category, rooms, volume_m3, flags, sort_order, pt_name, es_name, en_name) as (
  values
    ('sofa-2-seater', 'sofas', 'living', 1.2, '{}', 11, 'Sofá de 2 lugares', 'Sofá de 2 plazas', '2-seater sofa'),
    ('armchair', 'sofas', 'living', 0.5, '{}', 12, 'Poltrona', 'Sillón', 'Armchair'),
    ('chair', 'tables', 'living,kitchen', 0.1, '{}', 21, 'Cadeira', 'Silla', 'Chair'),
    ('kitchen-table', 'tables', 'kitchen', 0.5, '{}', 22, 'Mesa de cozinha', 'Mesa de cocina', 'Kitchen table'),
    ('single-bed-frame', 'beds', 'bedroom', 0.9, '{disassembly}', 31, 'Cama de solteiro (estrutura)', 'Cama individual (estructura)', 'Single bed (frame)'),
    ('bookcase', 'storage', 'living,office', 0.6, '{disassembly}', 41, 'Estante', 'Estantería', 'Bookcase'),
    ('tv-unit', 'storage', 'living', 0.5, '{}', 42, 'Móvel de TV', 'Mueble de TV', 'TV unit'),
    ('chest-of-drawers', 'storage', 'bedroom', 0.9, '{}', 43, 'Cómoda', 'Cómoda', 'Chest of drawers'),
    ('bedside-table', 'storage', 'bedroom', 0.1, '{}', 44, 'Mesa de cabeceira', 'Mesita de noche', 'Bedside table'),
    ('bathroom-cabinet', 'storage', 'bathroom', 0.3, '{}', 45, 'Móvel de casa de banho', 'Mueble de baño', 'Bathroom cabinet'),
    ('laundry-basket', 'storage', 'bathroom', 0.1, '{}', 46, 'Cesto de roupa', 'Cesto de la ropa', 'Laundry basket'),
    ('washing-machine', 'appliances', 'kitchen', 0.4, '{}', 51, 'Máquina de lavar roupa', 'Lavadora', 'Washing machine'),
    ('dishwasher', 'appliances', 'kitchen', 0.4, '{}', 52, 'Máquina de lavar loiça', 'Lavavajillas', 'Dishwasher'),
    ('microwave', 'appliances', 'kitchen', 0.1, '{}', 53, 'Micro-ondas', 'Microondas', 'Microwave'),
    ('box-small', 'boxes', 'boxes', 0.05, '{}', 61, 'Caixa pequena', 'Caja pequeña', 'Small box'),
    ('box-medium', 'boxes', 'boxes', 0.1, '{}', 62, 'Caixa média', 'Caja mediana', 'Medium box'),
    ('box-large', 'boxes', 'boxes', 0.15, '{}', 63, 'Caixa grande', 'Caja grande', 'Large box'),
    ('box-wardrobe', 'boxes', 'boxes', 0.3, '{}', 64, 'Caixa-roupeiro', 'Caja armario', 'Wardrobe box'),
    ('dish-box', 'boxes', 'kitchen,boxes', 0.1, '{fragile}', 65, 'Caixa de loiça', 'Caja de vajilla', 'Dish box'),
    ('tv', 'decor', 'living,bedroom', 0.1, '{fragile}', 71, 'Televisão', 'Televisión', 'Television'),
    ('floor-lamp', 'decor', 'living,bedroom', 0.1, '{fragile}', 72, 'Candeeiro de pé', 'Lámpara de pie', 'Floor lamp'),
    ('mirror', 'decor', 'bedroom,bathroom', 0.1, '{fragile}', 73, 'Espelho', 'Espejo', 'Mirror')
),
inserted as (
  insert into public.catalog_items (slug, category_id, volume_m3, handling_flags, sort_order)
  select s.slug, c.id, s.volume_m3, s.flags::public.handling_flag[], s.sort_order
  from seed s
  join public.catalog_categories c on c.slug = s.category
  returning id, slug
),
translations as (
  insert into public.catalog_item_translations (item_id, locale, name)
  select i.id, t.locale::public.app_locale, t.name
  from inserted i
  join seed s on s.slug = i.slug
  cross join lateral (values ('pt', s.pt_name), ('es', s.es_name), ('en', s.en_name)) as t (locale, name)
)
insert into public.catalog_item_rooms (item_id, room_id)
select i.id, r.id
from inserted i
join seed s on s.slug = i.slug
cross join lateral unnest(string_to_array(s.rooms, ',')) as room_slug
join public.catalog_rooms r on r.slug = room_slug;
