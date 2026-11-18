-- Paso 4b · Inventario y enlace: funciones de escritura (RF-15, RF-19 a RF-27, RF-37, RNF-02).
--
-- Son el único camino de escritura de las líneas, sus correcciones y el enlace. security definer: escriben
-- en tablas sin políticas de escritura. La empresa y el actor salen de la sesión, nunca de un parámetro.
-- Solo el administrador puede llamarlas.
--
-- Quién hace qué:
--   - Editar el borrador, enviarlo, abrir una versión nueva y compartir el enlace: la empresa dueña del pedido
--     (hoy created_by_company_id). El cliente hará lo mismo desde su enlace con una Edge Function, cuando se
--     decida dónde vive su web (B9).
--   - Corregir una línea: cualquier empresa con envío vivo en el pedido, solo para ella.
--
-- Versiones (A10, A11, confirmadas el 18/11/2026): el borrador es la versión sin submitted_at y se edita en
-- sitio. Al enviarla queda cerrada. Cambiar una versión enviada abre un borrador nuevo que copia la anterior.
-- La versión vigente de un pedido es la última enviada.

-- =====================================================================
-- lock_owned_order: autoriza y bloquea el pedido (uso interno)
-- =====================================================================

-- Comprueba que quien llama es administrador de la empresa dueña del pedido y que el pedido no está cancelado.
-- Bloquea la fila del pedido hasta el final de la transacción: dos escrituras simultáneas sobre el mismo
-- inventario o el mismo enlace no se pisan. Mismo error si el pedido no existe o es de otra empresa.
create or replace function public.lock_owned_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid := (select public.current_company_id());
  v_owner_id uuid;
  v_cancelled_at timestamptz;
begin
  if (select auth.uid()) is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select o.created_by_company_id, o.cancelled_at into v_owner_id, v_cancelled_at
  from public.orders o
  where o.id = p_order_id
  for update;

  if v_owner_id is null or v_owner_id <> v_company_id then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_cancelled_at is not null then
    raise exception 'order cancelled' using errcode = '23514';
  end if;
end;
$$;

-- Solo la usan las funciones de este archivo.
revoke all on function public.lock_owned_order(uuid) from public, anon, authenticated;

-- =====================================================================
-- save_inventory_line / delete_inventory_line: editar el borrador (RF-19, RF-20, RF-21)
-- =====================================================================

-- Crea una línea en el borrador del pedido (p_line_id nulo) o la actualiza. Devuelve su id.
-- Objeto del catálogo: volumen, peso y minutos salen del catálogo al crear la línea o al cambiar de objeto;
-- si el objeto no cambia, la línea conserva sus valores, así una línea copiada de la versión anterior no
-- cambia de base porque el catálogo se haya actualizado. Los cuidados pueden venir del parámetro.
-- Objeto libre: necesita descripción; el volumen es opcional y sin él la línea queda para revisión (RF-21).
-- Las fotos no se tocan aquí: llegan con el bucket de Storage.
create or replace function public.save_inventory_line(
  p_order_id uuid,
  p_line_id uuid,
  p_catalog_item_id uuid,
  p_description text,
  p_room text,
  p_quantity integer,
  p_unit_volume_m3 numeric,
  p_unit_weight_kg numeric,
  p_unit_minutes integer,
  p_handling_flags public.handling_flag[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inventory_id uuid;
  v_description text := nullif(btrim(coalesce(p_description, '')), '');
  v_room text := nullif(btrim(coalesce(p_room, '')), '');
  v_current public.inventory_lines%rowtype;
  v_item_found boolean := false;
  v_item_active boolean;
  v_item_volume numeric;
  v_item_weight numeric;
  v_item_minutes integer;
  v_item_flags public.handling_flag[];
  v_volume numeric;
  v_weight numeric;
  v_minutes integer;
  v_flags public.handling_flag[];
  v_line_id uuid;
begin
  perform public.lock_owned_order(p_order_id);

  select i.id into v_inventory_id
  from public.inventories i
  where i.order_id = p_order_id and i.submitted_at is null;
  if v_inventory_id is null then
    raise exception 'no draft inventory' using errcode = '23514';
  end if;

  if p_line_id is not null then
    select * into v_current
    from public.inventory_lines l
    where l.id = p_line_id and l.inventory_id = v_inventory_id;
    if v_current.id is null then
      raise exception 'line not found' using errcode = '22023';
    end if;
  end if;

  if p_catalog_item_id is not null then
    select true, ci.active, ci.volume_m3, ci.weight_kg, ci.handling_minutes, ci.handling_flags
    into v_item_found, v_item_active, v_item_volume, v_item_weight, v_item_minutes, v_item_flags
    from public.catalog_items ci
    where ci.id = p_catalog_item_id;
    if not coalesce(v_item_found, false) then
      raise exception 'catalog item not found' using errcode = '22023';
    end if;

    if v_current.catalog_item_id is not distinct from p_catalog_item_id and v_current.id is not null then
      -- Mismo objeto: se conserva la base de la línea.
      v_volume := v_current.unit_volume_m3;
      v_weight := v_current.unit_weight_kg;
      v_minutes := v_current.unit_minutes;
      v_flags := coalesce(p_handling_flags, v_current.handling_flags);
    else
      -- Objeto nuevo en la línea: tiene que estar activo y se copia su base del catálogo.
      if not v_item_active then
        raise exception 'catalog item inactive' using errcode = '22023';
      end if;
      v_volume := v_item_volume;
      v_weight := v_item_weight;
      v_minutes := v_item_minutes;
      v_flags := coalesce(p_handling_flags, v_item_flags);
    end if;
  else
    if v_description is null then
      raise exception 'missing description' using errcode = '22023';
    end if;
    v_volume := p_unit_volume_m3;
    v_weight := p_unit_weight_kg;
    v_minutes := coalesce(p_unit_minutes, 5);
    v_flags := coalesce(p_handling_flags, '{}');
  end if;

  if p_line_id is null then
    insert into public.inventory_lines (
      inventory_id, order_id, catalog_item_id, description, room, quantity,
      unit_volume_m3, unit_weight_kg, unit_minutes, handling_flags
    ) values (
      v_inventory_id, p_order_id, p_catalog_item_id, v_description, v_room, coalesce(p_quantity, 1),
      v_volume, v_weight, v_minutes, v_flags
    )
    returning id into v_line_id;
  else
    update public.inventory_lines
    set catalog_item_id = p_catalog_item_id,
        description = v_description,
        room = v_room,
        quantity = coalesce(p_quantity, 1),
        unit_volume_m3 = v_volume,
        unit_weight_kg = v_weight,
        unit_minutes = v_minutes,
        handling_flags = v_flags
    where id = p_line_id
    returning id into v_line_id;
  end if;

  return v_line_id;
end;
$$;

revoke all on function public.save_inventory_line(
  uuid, uuid, uuid, text, text, integer, numeric, numeric, integer, public.handling_flag[]
) from public, anon;
grant execute on function public.save_inventory_line(
  uuid, uuid, uuid, text, text, integer, numeric, numeric, integer, public.handling_flag[]
) to authenticated;

-- Borra una línea del borrador. Una línea de una versión enviada no se borra (trigger de A10).
create or replace function public.delete_inventory_line(p_line_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
begin
  select l.order_id into v_order_id from public.inventory_lines l where l.id = p_line_id;
  if v_order_id is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  perform public.lock_owned_order(v_order_id);

  delete from public.inventory_lines l
  using public.inventories i
  where l.id = p_line_id and i.id = l.inventory_id and i.submitted_at is null;
  if not found then
    raise exception 'a submitted inventory version cannot change' using errcode = '23514';
  end if;
end;
$$;

revoke all on function public.delete_inventory_line(uuid) from public, anon;
grant execute on function public.delete_inventory_line(uuid) to authenticated;

-- =====================================================================
-- save_inventory_address: dirección y accesos en el borrador (RF-23)
-- =====================================================================

-- Actualiza el texto, la ubicación y los accesos de una dirección del borrador. Recibe el estado completo:
-- un acceso nulo vuelve a su valor por defecto. El hueco (origen, parada, destino) no cambia aquí.
create or replace function public.save_inventory_address(
  p_inventory_address_id uuid,
  p_address text,
  p_lat double precision,
  p_lng double precision,
  p_floor integer,
  p_lift public.lift_size,
  p_narrow_stairs boolean,
  p_parking_distance_m integer,
  p_needs_permit boolean,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_address text := btrim(coalesce(p_address, ''));
begin
  select ia.order_id into v_order_id from public.inventory_addresses ia where ia.id = p_inventory_address_id;
  if v_order_id is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  perform public.lock_owned_order(v_order_id);

  if v_address = '' then
    raise exception 'missing required field' using errcode = '22023';
  end if;

  update public.inventory_addresses ia
  set address = v_address,
      lat = p_lat,
      lng = p_lng,
      floor = coalesce(p_floor, 0),
      lift = coalesce(p_lift, 'none'),
      narrow_stairs = coalesce(p_narrow_stairs, false),
      parking_distance_m = coalesce(p_parking_distance_m, 0),
      needs_permit = coalesce(p_needs_permit, false),
      notes = nullif(btrim(coalesce(p_notes, '')), '')
  from public.inventories i
  where ia.id = p_inventory_address_id and i.id = ia.inventory_id and i.submitted_at is null;
  if not found then
    raise exception 'a submitted inventory version cannot change' using errcode = '23514';
  end if;
end;
$$;

revoke all on function public.save_inventory_address(
  uuid, text, double precision, double precision, integer, public.lift_size, boolean, integer, boolean, text
) from public, anon;
grant execute on function public.save_inventory_address(
  uuid, text, double precision, double precision, integer, public.lift_size, boolean, integer, boolean, text
) to authenticated;

-- =====================================================================
-- set_inventory_extra: marcar o desmarcar un tipo de extra en el borrador (RF-24)
-- =====================================================================

-- Marca (p_selected true) un tipo del catálogo de Mudaro en el borrador, con nota opcional, o lo desmarca.
-- Sin cantidad ni precio: cada empresa los pone en su presupuesto (B5). Volver a marcarlo actualiza la nota.
-- Solo se pueden marcar tipos activos; desmarcar vale aunque el tipo se haya desactivado después.
create or replace function public.set_inventory_extra(
  p_order_id uuid,
  p_catalog_extra_id uuid,
  p_selected boolean,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inventory_id uuid;
begin
  perform public.lock_owned_order(p_order_id);

  select i.id into v_inventory_id
  from public.inventories i
  where i.order_id = p_order_id and i.submitted_at is null;
  if v_inventory_id is null then
    raise exception 'no draft inventory' using errcode = '23514';
  end if;

  if not coalesce(p_selected, false) then
    delete from public.inventory_extras
    where inventory_id = v_inventory_id and catalog_extra_id = p_catalog_extra_id;
    return;
  end if;

  if not exists (select 1 from public.catalog_extras e where e.id = p_catalog_extra_id and e.active) then
    raise exception 'catalog extra not found' using errcode = '22023';
  end if;

  insert into public.inventory_extras (inventory_id, order_id, catalog_extra_id, note)
  values (v_inventory_id, p_order_id, p_catalog_extra_id, nullif(btrim(coalesce(p_note, '')), ''))
  on conflict (inventory_id, catalog_extra_id) do update set note = excluded.note;
end;
$$;

revoke all on function public.set_inventory_extra(uuid, uuid, boolean, text) from public, anon;
grant execute on function public.set_inventory_extra(uuid, uuid, boolean, text) to authenticated;

-- =====================================================================
-- submit_inventory: cierra la versión (RF-26, RF-27)
-- =====================================================================

-- En una transacción:
--   1. comprueba que el borrador tiene al menos una línea y una dirección en cada hueco del pedido;
--      los accesos tienen valores por defecto, así que su obligatoriedad (RF-23) la valida la app;
--   2. si no es la versión 1, marca base_changed en las líneas nuevas o con la base distinta de la anterior
--      y copia las correcciones de cada empresa a las líneas que vienen de la versión anterior;
--   3. cierra la versión (submitted_at);
--   4. pasa a inventory_received los envíos en new, awaiting_inventory o quoted (RF-26, RF-27). Un envío won
--      no vuelve atrás. Los presupuestos enviados sobre la versión anterior pasarán a superseded en el paso 5;
--   5. registra inventory_submitted en cada envío vivo.
-- Devuelve el número de versión cerrada.
create or replace function public.submit_inventory(p_order_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_actor_name text;
  v_inventory_id uuid;
  v_version integer;
  v_shipment record;
begin
  perform public.lock_owned_order(p_order_id);

  select i.id, i.version into v_inventory_id, v_version
  from public.inventories i
  where i.order_id = p_order_id and i.submitted_at is null;
  if v_inventory_id is null then
    raise exception 'no draft inventory' using errcode = '23514';
  end if;

  if not exists (select 1 from public.inventory_lines l where l.inventory_id = v_inventory_id) then
    raise exception 'empty inventory' using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.addresses a
    where a.order_id = p_order_id
      and not exists (
        select 1 from public.inventory_addresses ia
        where ia.inventory_id = v_inventory_id and ia.address_id = a.id
      )
  ) then
    raise exception 'missing address' using errcode = '22023';
  end if;

  -- Los cuidados se comparan como conjunto: el orden del array no cambia la base.
  if v_version > 1 then
    update public.inventory_lines l
    set base_changed = not exists (
      select 1
      from public.inventory_lines p
      where p.id = l.previous_line_id
        and p.catalog_item_id is not distinct from l.catalog_item_id
        and p.quantity = l.quantity
        and p.unit_volume_m3 is not distinct from l.unit_volume_m3
        and p.unit_weight_kg is not distinct from l.unit_weight_kg
        and p.unit_minutes = l.unit_minutes
        and p.handling_flags @> l.handling_flags
        and l.handling_flags @> p.handling_flags
    )
    where l.inventory_id = v_inventory_id;

    -- Las correcciones de cada empresa siguen a su línea en la versión nueva (RF-27). Se copian ahora y no al
    -- abrir el borrador para incluir las que se hicieron mientras estaba abierto. Si la base cambió, la línea
    -- lleva base_changed y la pantalla avisa de que la corrección puede no valer.
    insert into public.inventory_line_adjustments (
      inventory_line_id, order_id, company_id, unit_volume_m3, unit_weight_kg, unit_minutes, updated_by
    )
    select n.id, a.order_id, a.company_id, a.unit_volume_m3, a.unit_weight_kg, a.unit_minutes, a.updated_by
    from public.inventory_line_adjustments a
    join public.inventory_lines n on n.previous_line_id = a.inventory_line_id
    where n.inventory_id = v_inventory_id
    on conflict (inventory_line_id, company_id) do nothing;
  end if;

  update public.inventories set submitted_at = now() where id = v_inventory_id;

  update public.shipments
  set status = 'inventory_received'
  where order_id = p_order_id and status in ('new', 'awaiting_inventory', 'quoted');

  select name into v_actor_name from public.company_users where id = v_user_id;

  for v_shipment in
    select s.id, s.company_id
    from public.shipments s
    where s.order_id = p_order_id and s.status not in ('lost', 'cancelled')
  loop
    insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
    values (
      v_shipment.company_id, v_shipment.id, 'inventory_submitted', 'company', v_user_id,
      jsonb_build_object('by', v_actor_name, 'version', v_version)
    );
  end loop;

  return v_version;
end;
$$;

revoke all on function public.submit_inventory(uuid) from public, anon;
grant execute on function public.submit_inventory(uuid) to authenticated;

-- =====================================================================
-- open_inventory_draft: versión nueva a partir de la vigente (RF-27, A10)
-- =====================================================================

-- Devuelve el borrador del pedido. Si no hay, lo crea copiando la última versión enviada: direcciones,
-- extras y líneas (con previous_line_id). base_changed y las correcciones de cada empresa se copian al
-- enviar el borrador, no aquí: así una corrección hecha mientras el borrador está abierto no se pierde.
create or replace function public.open_inventory_draft(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draft_id uuid;
  v_previous_id uuid;
  v_previous_version integer;
begin
  perform public.lock_owned_order(p_order_id);

  select i.id into v_draft_id
  from public.inventories i
  where i.order_id = p_order_id and i.submitted_at is null;
  if v_draft_id is not null then
    return v_draft_id;
  end if;

  -- Versión vigente (A11): la última enviada.
  select i.id, i.version into v_previous_id, v_previous_version
  from public.inventories i
  where i.order_id = p_order_id and i.submitted_at is not null
  order by i.version desc
  limit 1;
  if v_previous_id is null then
    raise exception 'no submitted inventory' using errcode = '23514';
  end if;

  insert into public.inventories (order_id, version, filled_by)
  values (p_order_id, v_previous_version + 1, 'company')
  returning id into v_draft_id;

  insert into public.inventory_addresses (
    inventory_id, order_id, address_id, address, lat, lng, floor, lift, narrow_stairs,
    parking_distance_m, needs_permit, notes
  )
  select v_draft_id, ia.order_id, ia.address_id, ia.address, ia.lat, ia.lng, ia.floor, ia.lift, ia.narrow_stairs,
         ia.parking_distance_m, ia.needs_permit, ia.notes
  from public.inventory_addresses ia
  where ia.inventory_id = v_previous_id;

  insert into public.inventory_extras (inventory_id, order_id, catalog_extra_id, note)
  select v_draft_id, e.order_id, e.catalog_extra_id, e.note
  from public.inventory_extras e
  where e.inventory_id = v_previous_id;

  insert into public.inventory_lines (
    inventory_id, order_id, catalog_item_id, description, room, quantity,
    unit_volume_m3, unit_weight_kg, unit_minutes, handling_flags, photos, previous_line_id
  )
  select v_draft_id, l.order_id, l.catalog_item_id, l.description, l.room, l.quantity,
         l.unit_volume_m3, l.unit_weight_kg, l.unit_minutes, l.handling_flags, l.photos, l.id
  from public.inventory_lines l
  where l.inventory_id = v_previous_id;

  return v_draft_id;
end;
$$;

revoke all on function public.open_inventory_draft(uuid) from public, anon;
grant execute on function public.open_inventory_draft(uuid) to authenticated;

-- =====================================================================
-- set_line_adjustment: corrección de una empresa sobre una línea (RF-37)
-- =====================================================================

-- Guarda el valor final que la empresa de la sesión da a una línea de la versión vigente (A11: la última
-- enviada). Las versiones anteriores quedan como estaban. Todos los valores nulos borran la corrección.
-- Solo afecta a esa empresa: las demás no la ven ni la usan (RNF-01).
create or replace function public.set_line_adjustment(
  p_line_id uuid,
  p_unit_volume_m3 numeric,
  p_unit_weight_kg numeric,
  p_unit_minutes integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_order_id uuid;
  v_inventory_id uuid;
  v_status public.shipment_status;
begin
  select l.order_id, l.inventory_id into v_order_id, v_inventory_id
  from public.inventory_lines l
  where l.id = p_line_id;

  -- can_read_order exige administrador y envío de la empresa en el pedido. Mismo error si la línea no existe.
  if v_user_id is null or v_order_id is null or not (select public.can_read_order(v_order_id)) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  -- Solo la versión vigente: ni el borrador ni una versión anterior.
  if v_inventory_id is distinct from (
    select i.id
    from public.inventories i
    where i.order_id = v_order_id and i.submitted_at is not null
    order by i.version desc
    limit 1
  ) then
    raise exception 'only the current version can be adjusted' using errcode = '23514';
  end if;

  select s.status into v_status
  from public.shipments s
  where s.order_id = v_order_id and s.company_id = v_company_id;
  if v_status = 'cancelled' then
    raise exception 'shipment cancelled' using errcode = '23514';
  end if;

  if p_unit_volume_m3 is null and p_unit_weight_kg is null and p_unit_minutes is null then
    delete from public.inventory_line_adjustments
    where inventory_line_id = p_line_id and company_id = v_company_id;
    return;
  end if;

  insert into public.inventory_line_adjustments (
    inventory_line_id, order_id, company_id, unit_volume_m3, unit_weight_kg, unit_minutes, updated_by
  ) values (
    p_line_id, v_order_id, v_company_id, p_unit_volume_m3, p_unit_weight_kg, p_unit_minutes, v_user_id
  )
  on conflict (inventory_line_id, company_id) do update
  set unit_volume_m3 = excluded.unit_volume_m3,
      unit_weight_kg = excluded.unit_weight_kg,
      unit_minutes = excluded.unit_minutes,
      updated_by = excluded.updated_by;
end;
$$;

revoke all on function public.set_line_adjustment(uuid, numeric, numeric, integer) from public, anon;
grant execute on function public.set_line_adjustment(uuid, numeric, numeric, integer) to authenticated;

-- =====================================================================
-- share_order_link: genera o reenvía el enlace del cliente (RF-15, RNF-02)
-- =====================================================================

-- En una transacción:
--   1. genera un token aleatorio (32 bytes en hexadecimal) y guarda solo su hash SHA-256 en hexadecimal;
--      la Edge Function que valide el enlace (B9) tiene que calcular el hash igual;
--   2. caduca a los link_validity_days del pedido, o a 7 días si no tiene (B7, 18/11/2026);
--   3. reenviar genera un token nuevo: el anterior deja de funcionar;
--   4. pasa a awaiting_inventory el envío en new y registra link_shared o link_resent, sin el token.
-- Devuelve el token en claro. Es la única vez que existe: la app arma la URL y no lo guarda.
-- La caducidad solo bloquea editar el inventario; ver y aceptar un presupuesto vigente sigue permitido.
create or replace function public.share_order_link(p_order_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_actor_name text;
  v_is_resend boolean;
  v_days smallint;
  v_token text;
  v_expires_at timestamptz;
  v_shipment record;
begin
  perform public.lock_owned_order(p_order_id);

  select o.token_hash is not null, coalesce(o.link_validity_days, 7)
  into v_is_resend, v_days
  from public.orders o
  where o.id = p_order_id;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires_at := now() + make_interval(days => v_days);

  update public.orders
  set token_hash = encode(extensions.digest(v_token, 'sha256'), 'hex'),
      token_expires_at = v_expires_at,
      link_validity_days = v_days
  where id = p_order_id;

  update public.shipments
  set status = 'awaiting_inventory'
  where order_id = p_order_id and company_id = v_company_id and status = 'new';

  select name into v_actor_name from public.company_users where id = v_user_id;

  for v_shipment in
    select s.id, s.company_id
    from public.shipments s
    where s.order_id = p_order_id and s.company_id = v_company_id
  loop
    insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
    values (
      v_shipment.company_id, v_shipment.id,
      case when v_is_resend then 'link_resent'::public.shipment_event_kind else 'link_shared'::public.shipment_event_kind end,
      'company', v_user_id,
      jsonb_build_object('by', v_actor_name, 'expiresAt', v_expires_at)
    );
  end loop;

  return v_token;
end;
$$;

revoke all on function public.share_order_link(uuid) from public, anon;
grant execute on function public.share_order_link(uuid) to authenticated;
