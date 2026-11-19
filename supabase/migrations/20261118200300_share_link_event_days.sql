-- Paso 4b · El evento del enlace guarda también los días de validez (RF-15).
--
-- La app (eventOf en apps/company/features/orders/infrastructure/orders.repo.ts) lee linkValidityDays en los
-- eventos link_shared y link_resent para escribir "válido por N dias" en el historial. share_order_link()
-- (20261118200200) solo guardaba expiresAt. Se sustituye la función con la misma firma y el mismo
-- comportamiento; el evento añade linkValidityDays.

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
      jsonb_build_object('by', v_actor_name, 'expiresAt', v_expires_at, 'linkValidityDays', v_days)
    );
  end loop;

  return v_token;
end;
$$;

revoke all on function public.share_order_link(uuid) from public, anon;
grant execute on function public.share_order_link(uuid) to authenticated;
