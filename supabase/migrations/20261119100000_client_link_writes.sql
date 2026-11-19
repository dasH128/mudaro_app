-- Escrituras del cliente desde el enlace del pedido (B9, decidido el 19/11/2026: web del cliente en apps/client).
--
-- El cliente no tiene cuenta. Su web (apps/client) llama a la Edge Function `client-order`, que calcula el hash
-- SHA-256 del token del enlace y llama a estas funciones con la clave de servicio. Por eso:
--   - client_save_inventory_draft y client_submit_inventory solo las puede ejecutar service_role. Nunca anon ni
--     authenticated: el hash del enlace no es un secreto que deba poder probar cualquiera con la clave pública.
--   - El pedido sale del hash del enlace, nunca de un parámetro con su id.
--   - Con el enlace caducado no se puede editar ni enviar el inventario (RF-15).
--
-- Para no duplicar las reglas del borrador, el cuerpo de save_inventory_draft y de submit_inventory pasa a dos
-- funciones internas (write_inventory_draft y close_inventory_draft). Las funciones de la empresa conservan su firma,
-- su autorización (lock_owned_order) y su comportamiento.

-- =====================================================================
-- write_inventory_draft: guardar el borrador (uso interno)
-- =====================================================================

-- Mismo cuerpo que save_inventory_draft (20261118300100) sin la autorización: quien la llama ya autorizó y bloqueó
-- el pedido.
create or replace function public.write_inventory_draft(
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

revoke all on function public.write_inventory_draft(uuid, jsonb, jsonb, jsonb) from public, anon, authenticated;

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
begin
  perform public.lock_owned_order(p_order_id);
  perform public.write_inventory_draft(p_order_id, p_lines, p_addresses, p_extras);
end;
$$;

revoke all on function public.save_inventory_draft(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_inventory_draft(uuid, jsonb, jsonb, jsonb) to authenticated;

-- =====================================================================
-- close_inventory_draft: enviar el borrador (uso interno)
-- =====================================================================

-- Mismo cuerpo que submit_inventory (20261118200200) sin la autorización. El actor del historial llega por
-- parámetro: la empresa (con su usuario) o el cliente (sin usuario).
create or replace function public.close_inventory_draft(
  p_order_id uuid,
  p_actor_type text,
  p_actor_id uuid,
  p_actor_name text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inventory_id uuid;
  v_version integer;
  v_shipment record;
begin
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

  for v_shipment in
    select s.id, s.company_id
    from public.shipments s
    where s.order_id = p_order_id and s.status not in ('lost', 'cancelled')
  loop
    insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
    values (
      v_shipment.company_id, v_shipment.id, 'inventory_submitted', p_actor_type, p_actor_id,
      jsonb_build_object('by', p_actor_name, 'version', v_version)
    );
  end loop;

  return v_version;
end;
$$;

revoke all on function public.close_inventory_draft(uuid, text, uuid, text) from public, anon, authenticated;

create or replace function public.submit_inventory(p_order_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_actor_name text;
begin
  perform public.lock_owned_order(p_order_id);
  select name into v_actor_name from public.company_users where id = v_user_id;
  return public.close_inventory_draft(p_order_id, 'company', v_user_id, v_actor_name);
end;
$$;

revoke all on function public.submit_inventory(uuid) from public, anon;
grant execute on function public.submit_inventory(uuid) to authenticated;

-- =====================================================================
-- lock_order_by_link: autoriza y bloquea el pedido del enlace (uso interno)
-- =====================================================================

-- Devuelve el pedido cuyo enlace tiene este hash y bloquea su fila hasta el final de la transacción. Mismo error si
-- el hash no existe que si el pedido está cancelado: no se revela qué enlaces existen. Para escribir, el enlace
-- tiene que estar vigente.
create or replace function public.lock_order_by_link(p_token_hash text, p_write boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_expires_at timestamptz;
  v_cancelled_at timestamptz;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'link not found' using errcode = '42501';
  end if;

  select o.id, o.token_expires_at, o.cancelled_at into v_order_id, v_expires_at, v_cancelled_at
  from public.orders o
  where o.token_hash = p_token_hash
  for update;

  if v_order_id is null or v_cancelled_at is not null then
    raise exception 'link not found' using errcode = '42501';
  end if;
  if p_write and v_expires_at <= now() then
    raise exception 'link expired' using errcode = '42501';
  end if;
  return v_order_id;
end;
$$;

revoke all on function public.lock_order_by_link(text, boolean) from public, anon, authenticated;

-- =====================================================================
-- client_save_inventory_draft / client_submit_inventory: el cliente desde su enlace (RF-19 a RF-26)
-- =====================================================================

create or replace function public.client_save_inventory_draft(
  p_token_hash text,
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
  v_order_id uuid := public.lock_order_by_link(p_token_hash, true);
begin
  perform public.write_inventory_draft(v_order_id, p_lines, p_addresses, p_extras);
end;
$$;

revoke all on function public.client_save_inventory_draft(text, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.client_save_inventory_draft(text, jsonb, jsonb, jsonb) to service_role;

-- El historial guarda el nombre de contacto del pedido como autor; el cliente no tiene usuario.
create or replace function public.client_submit_inventory(p_token_hash text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid := public.lock_order_by_link(p_token_hash, true);
  v_contact_name text;
begin
  select o.contact_name into v_contact_name from public.orders o where o.id = v_order_id;
  return public.close_inventory_draft(v_order_id, 'client', null, v_contact_name);
end;
$$;

revoke all on function public.client_submit_inventory(text) from public, anon, authenticated;
grant execute on function public.client_submit_inventory(text) to service_role;
