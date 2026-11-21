-- =====================================================================
-- RF-69: cancelar un pedido también cancela su trabajo programado
-- =====================================================================
-- Sustituye cancel_order() del 4a (20261109100200_orders_functions.sql), que dejó pendiente el trabajo para el paso 6.
-- Cambios respecto a la versión anterior:
--   1. el motivo es obligatorio (1 a 500 caracteres), igual que en cancel_job;
--   2. hace falta al menos un envío vivo: un pedido perdido no se cancela;
--   3. si algún envío vivo tiene el trabajo en curso, entregado o cerrado, no se cancela nada;
--   4. el trabajo programado se cancela en la misma transacción, como cancel_job: sin asignaciones, con motivo y con
--      el evento job_cancelled en el envío.
-- El resto no cambia: autoriza por dueño del pedido, rellena la cancelación del pedido, pasa a cancelled los envíos
-- vivos con su evento y deja una fila en audit_log. Avisar a otras empresas con envío vivo sigue sin hacer falta en el
-- MVP (un pedido, un envío).

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
  v_reason text := btrim(coalesce(p_reason, ''));
  v_owner_id uuid;
  v_cancelled_at timestamptz;
  v_shipment record;
  v_job record;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if length(v_reason) not between 1 and 500 then
    raise exception 'invalid reason' using errcode = '22023';
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

  -- Bloquea los envíos vivos y sus trabajos antes de comprobar nada: nadie cambia su estado mientras tanto.
  perform 1
  from public.shipments s
  where s.order_id = p_order_id
    and s.status in ('new', 'awaiting_inventory', 'inventory_received', 'quoted', 'won')
  for update;
  if not found then
    raise exception 'order not open' using errcode = '55000';
  end if;

  perform 1
  from public.jobs j
  join public.shipments s on s.id = j.shipment_id
  where s.order_id = p_order_id
  for update of j;

  -- Una mudanza empezada o hecha no se cancela: se cierra el trabajo.
  if exists (
    select 1
    from public.jobs j
    join public.shipments s on s.id = j.shipment_id
    where s.order_id = p_order_id
      and s.status = 'won'
      and j.status in ('in_progress', 'delivered', 'closed')
  ) then
    raise exception 'job started' using errcode = '55000';
  end if;

  select name into v_actor_name from public.company_users where id = v_user_id;

  update public.orders
  set cancelled_at = now(),
      cancellation_reason = v_reason,
      cancelled_by_type = 'company',
      cancelled_by_id = v_user_id
  where id = p_order_id;

  -- Trabajos programados de los envíos vivos: igual que cancel_job.
  for v_job in
    select j.id, j.company_id, j.shipment_id
    from public.jobs j
    join public.shipments s on s.id = j.shipment_id
    where s.order_id = p_order_id
      and s.status = 'won'
      and j.status = 'scheduled'
  loop
    delete from public.assignments where job_id = v_job.id;
    update public.jobs set status = 'cancelled', cancelled_at = now(), cancel_reason = v_reason where id = v_job.id;
    insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
    values (
      v_job.company_id, v_job.shipment_id, 'job_cancelled', 'company', v_user_id,
      jsonb_build_object('by', v_actor_name, 'reason', v_reason)
    );
  end loop;

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
