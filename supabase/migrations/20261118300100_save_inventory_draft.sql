-- Guardar el borrador del inventario de una vez (RF-19, RF-20, RF-23, RF-24).
--
-- La pantalla Inventário de apps/company guarda el estado completo de cada paso: objetos del catálogo, accesos de
-- cada dirección y extras. Con las funciones del paso 4b serían muchas llamadas sueltas y un fallo a medias dejaría
-- el borrador incompleto. Esta función lo hace en una sola transacción.
--
-- Cada sección es opcional: nula = no se toca. Así un paso guarda solo lo suyo.
--   p_lines:     [{ "catalogItemId": uuid, "room": slug o null, "quantity": entero >= 1 }]
--                Estado completo de los objetos del catálogo del borrador. La clave es (objeto, división): las
--                líneas que ya existen se actualizan (conservan previous_line_id, necesario para base_changed),
--                las nuevas se crean con la base del catálogo y las que no vienen se borran.
--                Los objetos libres no se tocan: la pantalla aún no los crea (siguen con save_inventory_line).
--   p_addresses: [{ "addressId": uuid del hueco (addresses.id), "floor", "lift", "narrowStairs",
--                  "parkingDistanceM", "needsPermit", "notes" }]
--                Accesos de cada dirección. El texto de la dirección no cambia aquí.
--   p_extras:    [{ "catalogExtraId": uuid, "note": texto o null }]
--                Estado completo de los extras marcados: los que no vienen se desmarcan.
--
-- Mismas reglas que el resto: solo el administrador de la empresa dueña del pedido, pedido no cancelado y solo el
-- borrador (una versión enviada no cambia).

create or replace function public.save_inventory_draft(
  p_order_id uuid,
  p_lines jsonb,
  p_addresses jsonb,
  p_extras jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inventory_id uuid;
  v_lines jsonb;
  v_count integer;
begin
  perform public.lock_owned_order(p_order_id);

  select i.id into v_inventory_id
  from public.inventories i
  where i.order_id = p_order_id and i.submitted_at is null;
  if v_inventory_id is null then
    raise exception 'no draft inventory' using errcode = '23514';
  end if;

  if (p_lines is not null and jsonb_typeof(p_lines) <> 'array')
    or (p_addresses is not null and jsonb_typeof(p_addresses) <> 'array')
    or (p_extras is not null and jsonb_typeof(p_extras) <> 'array') then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

  -- ===================================================================
  -- Objetos del catálogo
  -- ===================================================================
  if p_lines is not null then
    -- Normaliza una vez (división vacía = nula) y cada sentencia lo lee con jsonb_to_recordset.
    select coalesce(jsonb_agg(jsonb_build_object(
             'catalogItemId', e ->> 'catalogItemId',
             'room', nullif(btrim(e ->> 'room'), ''),
             'quantity', (e ->> 'quantity')::integer
           )), '[]'::jsonb)
    into v_lines
    from jsonb_array_elements(p_lines) as e;

    if exists (
      select 1 from jsonb_to_recordset(v_lines) as n ("catalogItemId" uuid, room text, quantity integer)
      where n."catalogItemId" is null or n.quantity is null or n.quantity < 1
    ) then
      raise exception 'invalid line' using errcode = '22023';
    end if;
    if exists (
      select 1 from jsonb_to_recordset(v_lines) as n ("catalogItemId" uuid, room text, quantity integer)
      group by n."catalogItemId", n.room having count(*) > 1
    ) then
      raise exception 'duplicated line' using errcode = '22023';
    end if;

    -- Un objeto nuevo en el borrador tiene que existir y estar activo. Uno que ya estaba se conserva aunque se haya
    -- desactivado después: el cliente lo declaró cuando estaba activo.
    select count(*) into v_count
    from jsonb_to_recordset(v_lines) as n ("catalogItemId" uuid, room text, quantity integer)
    where not exists (
        select 1 from public.inventory_lines l
        where l.inventory_id = v_inventory_id
          and l.catalog_item_id = n."catalogItemId"
          and l.room is not distinct from n.room
      )
      and not exists (select 1 from public.catalog_items ci where ci.id = n."catalogItemId" and ci.active);
    if v_count > 0 then
      raise exception 'catalog item not found' using errcode = '22023';
    end if;

    delete from public.inventory_lines l
    where l.inventory_id = v_inventory_id
      and l.catalog_item_id is not null
      and not exists (
        select 1 from jsonb_to_recordset(v_lines) as n ("catalogItemId" uuid, room text, quantity integer)
        where n."catalogItemId" = l.catalog_item_id and n.room is not distinct from l.room
      );

    update public.inventory_lines l
    set quantity = n.quantity
    from jsonb_to_recordset(v_lines) as n ("catalogItemId" uuid, room text, quantity integer)
    where l.inventory_id = v_inventory_id
      and l.catalog_item_id = n."catalogItemId"
      and l.room is not distinct from n.room
      and l.quantity <> n.quantity;

    insert into public.inventory_lines (
      inventory_id, order_id, catalog_item_id, room, quantity,
      unit_volume_m3, unit_weight_kg, unit_minutes, handling_flags
    )
    select v_inventory_id, p_order_id, n."catalogItemId", n.room, n.quantity,
           ci.volume_m3, ci.weight_kg, ci.handling_minutes, ci.handling_flags
    from jsonb_to_recordset(v_lines) as n ("catalogItemId" uuid, room text, quantity integer)
    join public.catalog_items ci on ci.id = n."catalogItemId"
    where not exists (
      select 1 from public.inventory_lines l
      where l.inventory_id = v_inventory_id
        and l.catalog_item_id = n."catalogItemId"
        and l.room is not distinct from n.room
    );
  end if;

  -- ===================================================================
  -- Accesos de cada dirección (RF-23)
  -- ===================================================================
  if p_addresses is not null then
    select count(*) into v_count
    from jsonb_array_elements(p_addresses) as e
    where not exists (
      select 1 from public.inventory_addresses ia
      where ia.inventory_id = v_inventory_id and ia.address_id = (e ->> 'addressId')::uuid
    );
    if v_count > 0 then
      raise exception 'address not found' using errcode = '22023';
    end if;

    update public.inventory_addresses ia
    set floor = coalesce((e ->> 'floor')::integer, 0),
        lift = coalesce((e ->> 'lift')::public.lift_size, 'none'),
        narrow_stairs = coalesce((e ->> 'narrowStairs')::boolean, false),
        parking_distance_m = coalesce((e ->> 'parkingDistanceM')::integer, 0),
        needs_permit = coalesce((e ->> 'needsPermit')::boolean, false),
        notes = nullif(btrim(coalesce(e ->> 'notes', '')), '')
    from jsonb_array_elements(p_addresses) as e
    where ia.inventory_id = v_inventory_id and ia.address_id = (e ->> 'addressId')::uuid;
  end if;

  -- ===================================================================
  -- Extras (RF-24)
  -- ===================================================================
  if p_extras is not null then
    if exists (
      select 1 from jsonb_array_elements(p_extras) as e
      group by (e ->> 'catalogExtraId') having count(*) > 1
    ) then
      raise exception 'duplicated extra' using errcode = '22023';
    end if;

    -- Igual que los objetos: uno nuevo tiene que estar activo; uno que ya estaba marcado se conserva.
    select count(*) into v_count
    from jsonb_array_elements(p_extras) as e
    where not exists (
        select 1 from public.inventory_extras x
        where x.inventory_id = v_inventory_id and x.catalog_extra_id = (e ->> 'catalogExtraId')::uuid
      )
      and not exists (
        select 1 from public.catalog_extras c where c.id = (e ->> 'catalogExtraId')::uuid and c.active
      );
    if v_count > 0 then
      raise exception 'catalog extra not found' using errcode = '22023';
    end if;

    delete from public.inventory_extras x
    where x.inventory_id = v_inventory_id
      and not exists (
        select 1 from jsonb_array_elements(p_extras) as e
        where (e ->> 'catalogExtraId')::uuid = x.catalog_extra_id
      );

    insert into public.inventory_extras (inventory_id, order_id, catalog_extra_id, note)
    select v_inventory_id, p_order_id, (e ->> 'catalogExtraId')::uuid, nullif(btrim(coalesce(e ->> 'note', '')), '')
    from jsonb_array_elements(p_extras) as e
    on conflict (inventory_id, catalog_extra_id) do update set note = excluded.note;
  end if;
end;
$$;

revoke all on function public.save_inventory_draft(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_inventory_draft(uuid, jsonb, jsonb, jsonb) to authenticated;
