-- Paso 6.0a · Editar, desactivar y reactivar vehículos (RF-05, RNF-08).
--
-- Los datos se guardan al salir de cada campo del panel del vehículo (P7), así que update_vehicle_data recibe
-- todos los valores y solo registra en audit_log los que cambian. La matrícula y el nombre no se editan aquí.
-- Un vehículo inactivo no se propone en cálculos ni en la agenda (RF-05): la agenda lo excluirá en el paso 6.1.

-- Guarda tipo, capacidad, carga máxima y coste por km de un vehículo de la empresa de la sesión.
-- Solo el administrador puede llamarla. Un vehículo de otra empresa o inexistente lanza no_data_found (P0002).
create or replace function public.update_vehicle_data(
  p_vehicle_id uuid,
  p_type public.vehicle_type,
  p_capacity_m3 numeric,
  p_max_load_kg integer,
  p_cost_per_km_cents integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_actor_name text;
  v_old public.vehicles%rowtype;
  v_old_cost integer;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_type is null or p_capacity_m3 is null or p_cost_per_km_cents is null then
    raise exception 'missing value' using errcode = '22023';
  end if;

  select * into v_old
  from public.vehicles
  where id = p_vehicle_id and company_id = v_company_id
  for update;

  if not found then
    raise exception 'vehicle not found' using errcode = 'P0002';
  end if;

  select cost_per_km_cents into v_old_cost from public.vehicle_costs where vehicle_id = p_vehicle_id;
  select name into v_actor_name from public.company_users where id = v_user_id;

  -- Los límites de capacidad, carga y coste los comprueban las restricciones de las tablas (23514).
  update public.vehicles
  set type = p_type, capacity_m3 = p_capacity_m3, max_load_kg = p_max_load_kg
  where id = p_vehicle_id
    and (type, capacity_m3, max_load_kg) is distinct from (p_type, p_capacity_m3, p_max_load_kg);

  insert into public.vehicle_costs (vehicle_id, company_id, cost_per_km_cents)
  values (p_vehicle_id, v_company_id, p_cost_per_km_cents)
  on conflict (vehicle_id) do update
  set cost_per_km_cents = excluded.cost_per_km_cents
  where public.vehicle_costs.cost_per_km_cents is distinct from excluded.cost_per_km_cents;

  -- Un evento por dato cambiado, con el valor anterior y el nuevo para el histórico del panel.
  insert into public.audit_log (actor_id, actor_type, company_id, action, entity, entity_id, data)
  select v_user_id, 'company', v_company_id, change.action, 'vehicle', p_vehicle_id::text,
         change.data || jsonb_build_object('by', v_actor_name)
  from (
    values
      ('vehicle_type_changed', v_old.type is distinct from p_type,
       jsonb_build_object('from', v_old.type, 'to', p_type)),
      ('vehicle_capacity_changed', v_old.capacity_m3 is distinct from p_capacity_m3,
       jsonb_build_object('from', v_old.capacity_m3, 'to', p_capacity_m3)),
      ('vehicle_max_load_changed', v_old.max_load_kg is distinct from p_max_load_kg,
       jsonb_build_object('fromKg', v_old.max_load_kg, 'toKg', p_max_load_kg)),
      ('vehicle_cost_changed', v_old_cost is distinct from p_cost_per_km_cents,
       jsonb_build_object('fromCents', v_old_cost, 'toCents', p_cost_per_km_cents))
  ) as change (action, changed, data)
  where change.changed;
end;
$$;

revoke all on function public.update_vehicle_data(uuid, public.vehicle_type, numeric, integer, integer) from public, anon;
grant execute on function public.update_vehicle_data(uuid, public.vehicle_type, numeric, integer, integer) to authenticated;

-- Activa o desactiva un vehículo de la empresa de la sesión. Desactivar exige motivo (taller u otro).
-- Si el vehículo ya está en ese estado no hace nada ni deja evento.
create or replace function public.set_vehicle_active(
  p_vehicle_id uuid,
  p_active boolean,
  p_reason public.vehicle_inactive_reason
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_actor_name text;
  v_was_active boolean;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_active is null or (not p_active and p_reason is null) then
    raise exception 'missing value' using errcode = '22023';
  end if;

  select active into v_was_active
  from public.vehicles
  where id = p_vehicle_id and company_id = v_company_id
  for update;

  if not found then
    raise exception 'vehicle not found' using errcode = 'P0002';
  end if;

  if v_was_active = p_active then
    return;
  end if;

  select name into v_actor_name from public.company_users where id = v_user_id;

  update public.vehicles
  set active = p_active,
      inactive_reason = case when p_active then null else p_reason end,
      inactive_since = case when p_active then null else (now() at time zone 'Europe/Lisbon')::date end,
      inactive_by = case when p_active then null else v_user_id end
  where id = p_vehicle_id;

  insert into public.audit_log (actor_id, actor_type, company_id, action, entity, entity_id, data)
  values (
    v_user_id, 'company', v_company_id,
    case when p_active then 'vehicle_reactivated' else 'vehicle_deactivated' end,
    'vehicle', p_vehicle_id::text,
    case when p_active then jsonb_build_object('by', v_actor_name)
         else jsonb_build_object('by', v_actor_name, 'reason', p_reason) end
  );
end;
$$;

revoke all on function public.set_vehicle_active(uuid, boolean, public.vehicle_inactive_reason) from public, anon;
grant execute on function public.set_vehicle_active(uuid, boolean, public.vehicle_inactive_reason) to authenticated;
