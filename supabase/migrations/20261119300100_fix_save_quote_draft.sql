-- Paso 5.2 · Corrección de save_quote_draft (20261119300000_quotes).
--
-- Con `with ordinality`, el alias de jsonb_array_elements es un registro (valor, posición) y no el JSON de la línea:
-- `e ->> 'kind'` fallaba (42883) y no se podía guardar ninguna línea. Se nombran las columnas (`e(line, ordinality)`)
-- y se lee `e.line`. El resto de la función no cambia. Lo detectó la prueba del flujo completo del 19/11/2026.

create or replace function public.save_quote_draft(p_order_id uuid, p_quote jsonb, p_lines jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_shipment record;
  v_inventory_id uuid;
  v_tariff_id uuid;
  v_quote_id uuid;
  v_number integer;
  v_version integer;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_quote is null or jsonb_typeof(p_quote) <> 'object' or p_lines is null or jsonb_typeof(p_lines) <> 'array' then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

  -- El envío de esta empresa en el pedido, bloqueado: dos guardados a la vez no crean dos borradores.
  select s.id, s.status into v_shipment
  from public.shipments s
  where s.order_id = p_order_id and s.company_id = v_company_id
  for update;
  if v_shipment.id is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_shipment.status in ('cancelled', 'won') then
    raise exception 'shipment closed' using errcode = '23514';
  end if;

  -- Versión vigente del inventario: la última enviada (A11).
  select i.id into v_inventory_id
  from public.inventories i
  where i.order_id = p_order_id and i.submitted_at is not null
  order by i.version desc
  limit 1;
  if v_inventory_id is null then
    raise exception 'no inventory' using errcode = '23514';
  end if;

  select t.id into v_tariff_id from public.tariffs t where t.company_id = v_company_id order by t.version desc limit 1;
  if v_tariff_id is null then
    raise exception 'no tariff' using errcode = '23514';
  end if;

  select q.id into v_quote_id from public.quotes q where q.shipment_id = v_shipment.id and q.status = 'draft';

  if v_quote_id is null then
    -- Número del envío si ya tiene orçamentos (las versiones lo comparten); si no, el siguiente de la empresa.
    select q.number, max(q.version) + 1 into v_number, v_version
    from public.quotes q where q.shipment_id = v_shipment.id group by q.number;
    if v_number is null then
      insert into public.quote_counters (company_id, last_number)
      values (v_company_id, 1)
      on conflict (company_id) do update set last_number = public.quote_counters.last_number + 1
      returning last_number into v_number;
      v_version := 1;
    end if;

    insert into public.quotes (company_id, shipment_id, inventory_id, tariff_id, number, version, pricing_mode, vat_pct, created_by)
    select v_company_id, v_shipment.id, v_inventory_id, v_tariff_id, v_number, v_version, t.quote_presentation, t.vat_pct, v_user_id
    from public.tariffs t where t.id = v_tariff_id
    returning id into v_quote_id;
  end if;

  update public.quotes q
  set inventory_id = v_inventory_id,
      tariff_id = v_tariff_id,
      pricing_mode = coalesce((p_quote ->> 'pricingMode')::public.quote_presentation, q.pricing_mode),
      vat_pct = t.vat_pct,
      volume_m3 = (p_quote ->> 'volumeM3')::numeric,
      vehicle_count = (p_quote ->> 'vehicleCount')::integer,
      operator_count = (p_quote ->> 'operatorCount')::integer,
      estimated_hours = (p_quote ->> 'estimatedHours')::numeric,
      km = (p_quote ->> 'km')::numeric,
      hourly_rate_cents = (p_quote ->> 'hourlyRateCents')::bigint,
      estimated_cost_cents = (p_quote ->> 'estimatedCostCents')::bigint,
      suggested_price_cents = (p_quote ->> 'suggestedPriceCents')::bigint,
      calculation = coalesce(p_quote -> 'calculation', '{}'::jsonb),
      valid_until = (p_quote ->> 'validUntil')::date,
      conditions = nullif(btrim(coalesce(p_quote ->> 'conditions', '')), '')
  from public.tariffs t
  where q.id = v_quote_id and t.id = v_tariff_id;

  delete from public.quote_lines where quote_id = v_quote_id;

  insert into public.quote_lines (
    quote_id, company_id, kind, company_extra_id, sort_order, description, quantity, unit, unit_price_cents,
    total_cents, optional, origin
  )
  select v_quote_id, v_company_id,
         (e.line ->> 'kind')::public.quote_line_kind,
         nullif(e.line ->> 'companyExtraId', '')::uuid,
         (ordinality - 1)::integer,
         btrim(e.line ->> 'description'),
         (e.line ->> 'quantity')::numeric,
         nullif(btrim(coalesce(e.line ->> 'unit', '')), ''),
         (e.line ->> 'unitPriceCents')::bigint,
         round((e.line ->> 'quantity')::numeric * (e.line ->> 'unitPriceCents')::bigint)::bigint,
         coalesce((e.line ->> 'optional')::boolean, false),
         coalesce((e.line ->> 'origin')::public.line_origin, 'calculated')
  from jsonb_array_elements(p_lines) with ordinality as e(line, ordinality);

  return v_quote_id;
end;
$$;

revoke all on function public.save_quote_draft(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_quote_draft(uuid, jsonb, jsonb) to authenticated;
