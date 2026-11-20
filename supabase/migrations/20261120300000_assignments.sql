-- Paso 6.1 · Agenda: periodo del trabajo, asignaciones sin solapes, reprogramar y cancelar (RF-47, RF-48, RF-50, RNF-08).
--
-- Plan del paso 6, P4 y P5: el trabajo guarda inicio y fin; cada asignación (un vehículo o una persona del equipo)
-- copia ese periodo; la base rechaza que un vehículo o una persona estén en dos periodos que se solapan.
-- Lectura para administradores; escritura solo por funciones.

-- Solapes de uuid con rangos en una restricción exclude.
create extension if not exists btree_gist with schema extensions;

-- Eventos del historial del envío para la agenda.
alter type public.shipment_event_kind add value if not exists 'job_assigned';
alter type public.shipment_event_kind add value if not exists 'job_rescheduled';
alter type public.shipment_event_kind add value if not exists 'job_cancelled';

-- =====================================================================
-- jobs: fin, notas, datos reales y cierre/cancelación
-- =====================================================================

alter table public.jobs
  add column scheduled_end timestamptz,
  add column notes text check (notes is null or length(notes) <= 2000),
  -- Datos reales (RF-58) y cierre (RF-59): los rellena el paso 6.6.
  add column actual_hours numeric(5, 2) check (actual_hours is null or (actual_hours > 0 and actual_hours <= 48)),
  add column actual_km numeric(7, 1) check (actual_km is null or (actual_km >= 0 and actual_km <= 5000)),
  add column closed_at timestamptz,
  add column closed_by uuid references public.company_users (id) on delete set null,
  add column cancelled_at timestamptz,
  add column cancel_reason text check (cancel_reason is null or length(btrim(cancel_reason)) between 1 and 500);

-- Fin por defecto: inicio más las horas estimadas del orçamento, o 4 h si no tiene (la regla que usaba la Agenda).
create or replace function public.default_job_end(p_start timestamptz, p_quote_id uuid)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select p_start + make_interval(secs => greatest(coalesce(q.estimated_hours, 4), 0.5) * 3600)
  from public.quotes q
  where q.id = p_quote_id;
$$;

-- Sin security definer: respeta RLS de quien llama. Conserva el permiso por defecto porque la usa el trigger de
-- jobs, también cuando el cliente acepta un orçamento desde client-order (service_role).

update public.jobs j set scheduled_end = public.default_job_end(j.scheduled_start, j.quote_id) where scheduled_end is null;

alter table public.jobs
  alter column scheduled_end set not null,
  add constraint jobs_period_check check (scheduled_end > scheduled_start),
  add constraint jobs_cancelled_check check ((status = 'cancelled') = (cancelled_at is not null)),
  -- Para claves compuestas con company_id desde las asignaciones.
  add constraint jobs_id_company_id_key unique (id, company_id);

-- Un trabajo nuevo (al aceptar, client_accept_quote) recibe su fin por defecto.
create or replace function public.jobs_fill_scheduled_end()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.scheduled_end is null then
    new.scheduled_end := public.default_job_end(new.scheduled_start, new.quote_id);
  end if;
  return new;
end;
$$;

create trigger jobs_fill_scheduled_end
before insert on public.jobs
for each row execute function public.jobs_fill_scheduled_end();

alter table public.vehicles add constraint vehicles_id_company_id_key unique (id, company_id);

-- =====================================================================
-- assignments
-- =====================================================================

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  job_id uuid not null,
  vehicle_id uuid,
  crew_member_id uuid,
  -- Jefe de equipo del trabajo: solo una persona y como mucho una por trabajo.
  is_lead boolean not null default false,
  -- Copia del periodo del trabajo; reschedule_job lo mueve con él.
  period tstzrange not null,
  created_at timestamptz not null default now(),
  foreign key (job_id, company_id) references public.jobs (id, company_id) on delete cascade,
  foreign key (vehicle_id, company_id) references public.vehicles (id, company_id) on delete restrict,
  foreign key (company_id, crew_member_id) references public.crew_members (company_id, id) on delete restrict,
  check (num_nonnulls(vehicle_id, crew_member_id) = 1),
  check (not is_lead or crew_member_id is not null),
  check (not isempty(period)),
  unique (job_id, vehicle_id),
  unique (job_id, crew_member_id),
  -- RF-48: un vehículo o una persona no pueden estar en dos periodos que se solapan. '[)': acabar a las 13:00 y
  -- empezar a las 13:00 no se solapa.
  constraint assignments_vehicle_no_overlap exclude using gist (vehicle_id with =, period with &&) where (vehicle_id is not null),
  constraint assignments_crew_no_overlap exclude using gist (crew_member_id with =, period with &&) where (crew_member_id is not null)
);

create unique index assignments_one_lead_idx on public.assignments (job_id) where is_lead;
create index assignments_company_period_idx on public.assignments using gist (company_id, period);

alter table public.assignments enable row level security;
revoke all on public.assignments from anon, authenticated;
grant select on public.assignments to authenticated;

create policy "administrators read their company assignments"
on public.assignments for select to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

-- =====================================================================
-- Comprobación de solapes con un error que la pantalla puede explicar
-- =====================================================================

-- Lanza 23P01 si alguno de los recursos ya está en otro trabajo que se solapa con p_period. El detalle es JSON:
-- {"resource": "vehicle" | "crew", "id": ..., "jobId": ...}. La restricción exclude sigue siendo la última barrera.
create or replace function public.check_assignment_overlaps(
  p_job_id uuid,
  p_period tstzrange,
  p_vehicle_ids uuid[],
  p_crew_member_ids uuid[]
)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  v_conflict record;
begin
  select a.vehicle_id, a.crew_member_id, a.job_id into v_conflict
  from public.assignments a
  where a.job_id <> p_job_id
    and a.period && p_period
    and (a.vehicle_id = any (p_vehicle_ids) or a.crew_member_id = any (p_crew_member_ids))
  order by a.vehicle_id nulls last
  limit 1;

  if found then
    raise exception 'assignment overlap' using
      errcode = '23P01',
      detail = jsonb_build_object(
        'resource', case when v_conflict.vehicle_id is not null then 'vehicle' else 'crew' end,
        'id', coalesce(v_conflict.vehicle_id, v_conflict.crew_member_id),
        'jobId', v_conflict.job_id
      )::text;
  end if;
end;
$$;

revoke all on function public.check_assignment_overlaps(uuid, tstzrange, uuid[], uuid[]) from public, anon, authenticated;

-- =====================================================================
-- set_job_assignments: sustituye vehículos y equipo de un trabajo (RF-48)
-- =====================================================================

-- Errores: 42501 sin permiso; P0002 trabajo de otra empresa o inexistente; 55000 trabajo cerrado, entregado o
-- cancelado; 23514 vehículo o persona inexistente o inactivo (detalle JSON con resource e id), o jefe que no está
-- en el equipo; 23P01 solape (ver check_assignment_overlaps).
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
  select v_company_id, p_job_id, c, c = p_lead_id, v_period from unnest(v_crew_ids) c;

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

-- =====================================================================
-- reschedule_job: cambia inicio y fin, y mueve las asignaciones (RF-50)
-- =====================================================================

-- Solo trabajos programados. Errores como set_job_assignments; 22023 si el fin no es posterior al inicio o el
-- trabajo dura más de 24 h (límite para cazar errores de tecleo).
create or replace function public.reschedule_job(p_job_id uuid, p_start timestamptz, p_end timestamptz)
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
  v_period tstzrange;
  v_vehicle_ids uuid[];
  v_crew_ids uuid[];
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_start is null or p_end is null or p_end <= p_start or p_end - p_start > interval '24 hours' then
    raise exception 'invalid period' using errcode = '22023';
  end if;

  select * into v_job from public.jobs where id = p_job_id and company_id = v_company_id for update;
  if not found then
    raise exception 'job not found' using errcode = 'P0002';
  end if;
  if v_job.status <> 'scheduled' then
    raise exception 'job not open' using errcode = '55000';
  end if;

  if v_job.scheduled_start = p_start and v_job.scheduled_end = p_end then
    return;
  end if;

  v_period := tstzrange(p_start, p_end, '[)');
  select coalesce(array_agg(vehicle_id) filter (where vehicle_id is not null), '{}'),
         coalesce(array_agg(crew_member_id) filter (where crew_member_id is not null), '{}')
  into v_vehicle_ids, v_crew_ids
  from public.assignments where job_id = p_job_id;

  perform public.check_assignment_overlaps(p_job_id, v_period, v_vehicle_ids, v_crew_ids);

  update public.jobs set scheduled_start = p_start, scheduled_end = p_end where id = p_job_id;
  update public.assignments set period = v_period where job_id = p_job_id;

  select name into v_actor_name from public.company_users where id = v_user_id;

  insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
  values (
    v_company_id, v_job.shipment_id, 'job_rescheduled', 'company', v_user_id,
    jsonb_build_object(
      'by', v_actor_name,
      'fromStart', v_job.scheduled_start, 'fromEnd', v_job.scheduled_end,
      'toStart', p_start, 'toEnd', p_end
    )
  );
end;
$$;

revoke all on function public.reschedule_job(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.reschedule_job(uuid, timestamptz, timestamptz) to authenticated;

-- =====================================================================
-- cancel_job: cancela el trabajo con motivo y libera las asignaciones (RF-50)
-- =====================================================================

-- Solo trabajos programados. El envío no cambia: cancelar el pedido entero es RF-69, pendiente.
create or replace function public.cancel_job(p_job_id uuid, p_reason text)
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
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if length(v_reason) not between 1 and 500 then
    raise exception 'invalid reason' using errcode = '22023';
  end if;

  select * into v_job from public.jobs where id = p_job_id and company_id = v_company_id for update;
  if not found then
    raise exception 'job not found' using errcode = 'P0002';
  end if;
  if v_job.status <> 'scheduled' then
    raise exception 'job not open' using errcode = '55000';
  end if;

  delete from public.assignments where job_id = p_job_id;
  update public.jobs set status = 'cancelled', cancelled_at = now(), cancel_reason = v_reason where id = p_job_id;

  select name into v_actor_name from public.company_users where id = v_user_id;

  insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
  values (
    v_company_id, v_job.shipment_id, 'job_cancelled', 'company', v_user_id,
    jsonb_build_object('by', v_actor_name, 'reason', v_reason)
  );
end;
$$;

revoke all on function public.cancel_job(uuid, text) from public, anon;
grant execute on function public.cancel_job(uuid, text) to authenticated;
