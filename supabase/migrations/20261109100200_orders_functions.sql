-- Paso 4a · Pedidos y envíos: funciones de escritura (RF-13, RF-14, RF-19, RF-69, RNF-08).
--
-- Son el único camino de escritura de las tablas de pedidos. security definer: escriben en tablas sin
-- políticas de escritura. La empresa y el actor salen de la sesión, nunca de un parámetro.
-- Solo el administrador puede llamarlas.

-- =====================================================================
-- create_order: pedido, envío, ficha del cliente y versión 1 del inventario en borrador
-- =====================================================================

-- Crea en una transacción:
--   1. la ficha del cliente, o reutiliza la de la empresa (RF-14): por p_client_id si llega, o por teléfono;
--   2. el pedido con el contacto declarado;
--   3. el envío a la empresa de la sesión, con su número visible (sin saltos);
--   4. la versión 1 del inventario en borrador, con los huecos de dirección y su texto (A1, A10);
--   5. el evento "created" del historial y la fila de audit_log.
-- Devuelve el número visible del envío, que es el id del pedido en la URL de la app.
-- El enlace del cliente no se genera aquí: llega con el paso 4b (RF-15, RNF-02).
create or replace function public.create_order(
  p_client_id uuid,
  p_client_name text,
  p_client_phone text,
  p_client_type public.client_type,
  p_client_email text,
  p_client_tax_id text,
  p_origin text,
  p_destination text,
  p_stops text[],
  p_desired_date date,
  p_date_flexibility public.date_flexibility,
  p_contact_source text,
  p_filled_by public.filled_by,
  p_link_validity_days smallint
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_actor_name text;
  v_name text := btrim(coalesce(p_client_name, ''));
  v_origin text := btrim(coalesce(p_origin, ''));
  v_destination text := btrim(coalesce(p_destination, ''));
  -- Paradas sin huecos en blanco, en el orden recibido.
  v_stops text[] := array(
    select btrim(s) from unnest(coalesce(p_stops, '{}'::text[])) with ordinality as t(s, n)
    where btrim(s) <> '' order by n
  );
  v_link_days smallint := case when p_filled_by = 'client' then p_link_validity_days else null end;
  v_client_id uuid;
  v_order_id uuid;
  v_shipment_id uuid;
  v_number integer;
  v_inventory_id uuid;
  v_address_id uuid;
  v_i integer;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  -- Las mismas reglas que valida zod en el servidor de la app: aquí son la última barrera.
  if coalesce(p_client_phone, '') !~ '^\+351[0-9]{9}$' then
    raise exception 'invalid phone' using errcode = '22023';
  end if;
  if v_name = '' or v_origin = '' or v_destination = '' or p_desired_date is null then
    raise exception 'missing required field' using errcode = '22023';
  end if;
  -- Máximo de paradas intermedias (MAX_STOPS en la app). Provisional.
  if coalesce(array_length(v_stops, 1), 0) > 3 then
    raise exception 'too many stops' using errcode = '22023';
  end if;

  select name into v_actor_name from public.company_users where id = v_user_id;

  -- 1. Ficha del cliente (RF-14). Nunca se reutiliza una ficha de otra empresa.
  if p_client_id is not null then
    select c.id into v_client_id
    from public.clients c
    where c.id = p_client_id and c.company_id = v_company_id;
    if v_client_id is null then
      raise exception 'client not found' using errcode = '22023';
    end if;
  else
    select c.id into v_client_id
    from public.clients c
    where c.company_id = v_company_id and c.phone = p_client_phone;

    if v_client_id is null then
      insert into public.clients (company_id, name, phone, email, tax_id, type)
      values (
        v_company_id, v_name, p_client_phone,
        nullif(btrim(coalesce(p_client_email, '')), ''),
        nullif(btrim(coalesce(p_client_tax_id, '')), ''),
        coalesce(p_client_type, 'private')
      )
      returning id into v_client_id;
    end if;
  end if;

  -- 2. Pedido.
  insert into public.orders (
    created_by_company_id, contact_name, contact_phone, desired_date, date_flexibility,
    contact_source, link_validity_days
  ) values (
    v_company_id, v_name, p_client_phone, p_desired_date, coalesce(p_date_flexibility, 'exact'),
    nullif(btrim(coalesce(p_contact_source, '')), ''), v_link_days
  )
  returning id into v_order_id;

  -- 3. Envío con el siguiente número de la empresa. El upsert bloquea la fila del contador hasta el final
  -- de la transacción, así dos pedidos simultáneos no reciben el mismo número.
  insert into public.shipment_counters (company_id, last_number)
  values (v_company_id, 1)
  on conflict (company_id) do update set last_number = public.shipment_counters.last_number + 1
  returning last_number into v_number;

  insert into public.shipments (company_id, order_id, number, client_id)
  values (v_company_id, v_order_id, v_number, v_client_id)
  returning id into v_shipment_id;

  -- 4. Versión 1 del inventario en borrador, con origen, paradas y destino.
  insert into public.inventories (order_id, version, filled_by)
  values (v_order_id, 1, p_filled_by)
  returning id into v_inventory_id;

  insert into public.addresses (order_id, role, sort_order)
  values (v_order_id, 'origin', 0)
  returning id into v_address_id;
  insert into public.inventory_addresses (inventory_id, order_id, address_id, address)
  values (v_inventory_id, v_order_id, v_address_id, v_origin);

  for v_i in 1 .. coalesce(array_length(v_stops, 1), 0) loop
    insert into public.addresses (order_id, role, sort_order)
    values (v_order_id, 'stop', v_i)
    returning id into v_address_id;
    insert into public.inventory_addresses (inventory_id, order_id, address_id, address)
    values (v_inventory_id, v_order_id, v_address_id, v_stops[v_i]);
  end loop;

  insert into public.addresses (order_id, role, sort_order)
  values (v_order_id, 'destination', coalesce(array_length(v_stops, 1), 0) + 1)
  returning id into v_address_id;
  insert into public.inventory_addresses (inventory_id, order_id, address_id, address)
  values (v_inventory_id, v_order_id, v_address_id, v_destination);

  -- 5. Historial del envío y auditoría (RNF-08). El nombre de quien actúa queda en el evento.
  insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
  values (
    v_company_id, v_shipment_id, 'created', 'company', v_user_id,
    jsonb_build_object('by', v_actor_name, 'filledBy', p_filled_by, 'linkValidityDays', v_link_days)
  );

  insert into public.audit_log (actor_id, actor_type, company_id, action, entity, entity_id, data)
  values (
    v_user_id, 'company', v_company_id, 'order_created', 'order', v_order_id::text,
    jsonb_build_object('by', v_actor_name, 'shipmentNumber', v_number)
  );

  return v_number;
end;
$$;

revoke all on function public.create_order(
  uuid, text, text, public.client_type, text, text, text, text, text[], date,
  public.date_flexibility, text, public.filled_by, smallint
) from public, anon;
grant execute on function public.create_order(
  uuid, text, text, public.client_type, text, text, text, text, text[], date,
  public.date_flexibility, text, public.filled_by, smallint
) to authenticated;

-- =====================================================================
-- cancel_order: cancela el pedido y sus envíos vivos (RF-69, A4)
-- =====================================================================

-- En una transacción:
--   1. autoriza por dueño del pedido: hoy la empresa creadora (con cuentas, account_id);
--      una empresa que solo tiene un envío en un pedido ajeno no puede cancelarlo;
--   2. rellena la cancelación del pedido;
--   3. pasa a cancelled los envíos vivos (el trigger guarda status_changed_at);
--   4. trabajos: pendiente del paso 6 (cancelar el programado y bloquear si está en curso o entregado);
--   5. evento "cancelled" en cada envío y fila de audit_log;
--   6. aviso a las demás empresas con envío vivo: en el MVP no hay ninguna.
create or replace function public.cancel_order(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_actor_name text;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_owner_id uuid;
  v_cancelled_at timestamptz;
  v_shipment record;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  -- Bloquea el pedido: dos cancelaciones simultáneas no se pisan.
  select o.created_by_company_id, o.cancelled_at into v_owner_id, v_cancelled_at
  from public.orders o
  where o.id = p_order_id
  for update;

  -- El mismo error si no existe o no es de esta empresa: no se revela que existe.
  if v_owner_id is null or v_owner_id <> v_company_id then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_cancelled_at is not null then
    raise exception 'order already cancelled' using errcode = '23514';
  end if;

  select name into v_actor_name from public.company_users where id = v_user_id;

  update public.orders
  set cancelled_at = now(),
      cancellation_reason = v_reason,
      cancelled_by_type = 'company',
      cancelled_by_id = v_user_id
  where id = p_order_id;

  for v_shipment in
    update public.shipments
    set status = 'cancelled'
    where order_id = p_order_id
      and status in ('new', 'awaiting_inventory', 'inventory_received', 'quoted', 'won')
    returning id, company_id
  loop
    insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
    values (
      v_shipment.company_id, v_shipment.id, 'cancelled', 'company', v_user_id,
      jsonb_build_object('by', v_actor_name, 'reason', v_reason)
    );
  end loop;

  insert into public.audit_log (actor_id, actor_type, company_id, action, entity, entity_id, data)
  values (
    v_user_id, 'company', v_company_id, 'order_cancelled', 'order', p_order_id::text,
    jsonb_build_object('by', v_actor_name, 'reason', v_reason)
  );
end;
$$;

revoke all on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to authenticated;
