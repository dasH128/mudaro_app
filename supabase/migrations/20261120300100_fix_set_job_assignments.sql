-- Paso 6.1 · Corrige set_job_assignments: sin jefe de equipo (p_lead_id null), `c = p_lead_id` daba null e
-- is_lead (not null) rechazaba la asignación con 23502. Encontrado en la prueba con SQL del paso 6.1.

create or replace function public.set_job_assignments(
  p_job_id uuid,
  p_vehicle_ids uuid[],
  p_crew_member_ids uuid[],
  p_lead_id uuid
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
  v_job public.jobs%rowtype;
  v_vehicle_ids uuid[];
  v_crew_ids uuid[];
  v_period tstzrange;
  v_missing uuid;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select * into v_job from public.jobs where id = p_job_id and company_id = v_company_id for update;
  if not found then
    raise exception 'job not found' using errcode = 'P0002';
  end if;
  if v_job.status not in ('scheduled', 'in_progress') then
    raise exception 'job not open' using errcode = '55000';
  end if;

  select coalesce(array_agg(distinct v), '{}') into v_vehicle_ids from unnest(coalesce(p_vehicle_ids, '{}')) v where v is not null;
  select coalesce(array_agg(distinct c), '{}') into v_crew_ids from unnest(coalesce(p_crew_member_ids, '{}')) c where c is not null;

  -- RF-05 y P5: solo vehículos y personas activos de la empresa.
  select v into v_missing from unnest(v_vehicle_ids) v
  where not exists (select 1 from public.vehicles x where x.id = v and x.company_id = v_company_id and x.active)
  limit 1;
  if v_missing is not null then
    raise exception 'vehicle not available' using errcode = '23514',
      detail = jsonb_build_object('resource', 'vehicle', 'id', v_missing)::text;
  end if;

  select c into v_missing from unnest(v_crew_ids) c
  where not exists (select 1 from public.crew_members x where x.id = c and x.company_id = v_company_id and x.active)
  limit 1;
  if v_missing is not null then
    raise exception 'crew member not available' using errcode = '23514',
      detail = jsonb_build_object('resource', 'crew', 'id', v_missing)::text;
  end if;

  if p_lead_id is not null and not (p_lead_id = any (v_crew_ids)) then
    raise exception 'lead not in crew' using errcode = '23514',
      detail = jsonb_build_object('resource', 'lead', 'id', p_lead_id)::text;
  end if;

  v_period := tstzrange(v_job.scheduled_start, v_job.scheduled_end, '[)');
  perform public.check_assignment_overlaps(p_job_id, v_period, v_vehicle_ids, v_crew_ids);

  delete from public.assignments where job_id = p_job_id;

  insert into public.assignments (company_id, job_id, vehicle_id, period)
  select v_company_id, p_job_id, v, v_period from unnest(v_vehicle_ids) v;

  insert into public.assignments (company_id, job_id, crew_member_id, is_lead, period)
  -- Sin jefe (p_lead_id null), c = p_lead_id da null: coalesce a false.
  select v_company_id, p_job_id, c, coalesce(c = p_lead_id, false), v_period from unnest(v_crew_ids) c;

  select name into v_actor_name from public.company_users where id = v_user_id;

  -- Los nombres se copian en el evento: el historial no depende de que el vehículo o la persona sigan existiendo.
  insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
  values (
    v_company_id, v_job.shipment_id, 'job_assigned', 'company', v_user_id,
    jsonb_build_object(
      'by', v_actor_name,
      'vehicles', coalesce((select jsonb_agg(coalesce(x.name, x.plate) order by x.plate) from public.vehicles x where x.id = any (v_vehicle_ids)), '[]'::jsonb),
      'crew', coalesce((select jsonb_agg(x.name order by x.name) from public.crew_members x where x.id = any (v_crew_ids)), '[]'::jsonb),
      'lead', (select x.name from public.crew_members x where x.id = p_lead_id)
    )
  );
end;
$$;

revoke all on function public.set_job_assignments(uuid, uuid[], uuid[], uuid) from public, anon;
grant execute on function public.set_job_assignments(uuid, uuid[], uuid[], uuid) to authenticated;
