-- Paso 6.4 · Ejecución del trabajo desde el panel: fotos, actas de recogida y entrega, e incidencias
-- (RF-51, RF-52, RF-53, RF-55, RF-57, RNF-05, RNF-08). Plan: docs/plan-paso-6-trabajos.md, P6 a P10.
--
-- En el MVP lo registra el administrador desde apps/company; cuando exista la app del operario, escribirá en estas
-- mismas tablas con source = 'app'. Cada registro guarda cuándo pasó (lo escribe la persona) y cuándo se registró
-- (lo pone la base). Antes del cierre, lo registrado por error se puede eliminar y queda en el historial; al cerrar
-- (paso 6.6) un trigger bloquea cualquier cambio en el trabajo y en todo lo que cuelga de él (RF-57).

-- =====================================================================
-- Tipos
-- =====================================================================

-- Momento del trabajo al que pertenece una foto o un acta.
create type public.job_moment as enum ('pickup', 'delivery', 'incident');
create type public.incident_type as enum ('damage', 'undeclared_item', 'delay', 'access', 'other');
-- accepted y disputed (firma del cliente, RF-54) llegan con la app del operario.
create type public.incident_status as enum ('open', 'resolved');
-- Desde dónde se registró: el panel del administrador o, más adelante, la app del operario.
create type public.record_source as enum ('panel', 'app');

alter type public.shipment_event_kind add value if not exists 'pickup_recorded';
alter type public.shipment_event_kind add value if not exists 'delivery_recorded';
alter type public.shipment_event_kind add value if not exists 'incident_reported';
alter type public.shipment_event_kind add value if not exists 'incident_resolved';
alter type public.shipment_event_kind add value if not exists 'job_record_deleted';

-- =====================================================================
-- Tablas
-- =====================================================================

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  job_id uuid not null,
  type public.incident_type not null,
  description text not null check (length(btrim(description)) between 1 and 1000),
  -- Importe adicional para facturar (RF-53, RF-60). 0 si no hay.
  extra_amount_cents bigint not null default 0 check (extra_amount_cents between 0 and 10000000),
  occurred_at timestamptz not null,
  status public.incident_status not null default 'open',
  resolution_note text check (resolution_note is null or length(btrim(resolution_note)) between 1 and 1000),
  resolved_at timestamptz,
  resolved_by uuid references public.company_users (id) on delete set null,
  source public.record_source not null,
  recorded_by uuid references public.company_users (id) on delete set null,
  recorded_at timestamptz not null default now(),
  foreign key (job_id, company_id) references public.jobs (id, company_id) on delete restrict,
  unique (id, company_id),
  check ((status = 'resolved') = (resolved_at is not null and resolution_note is not null))
);

create index incidents_job_id_idx on public.incidents (job_id);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  job_id uuid not null,
  moment public.job_moment not null,
  -- Foto de una incidencia: el momento es 'incident' y la incidencia es del mismo trabajo.
  incident_id uuid,
  -- Ruta en el bucket job-evidence: <company_id>/<job_id>/<archivo>.
  file_path text not null unique,
  -- Cuándo se hizo la foto (la escribe la persona en el panel; la pondrá el móvil en la app).
  taken_at timestamptz not null,
  -- Ubicación: solo desde la app del operario (RF-51). Las fotos del panel no la llevan.
  lat double precision,
  lng double precision,
  source public.record_source not null,
  recorded_by uuid references public.company_users (id) on delete set null,
  recorded_at timestamptz not null default now(),
  foreign key (job_id, company_id) references public.jobs (id, company_id) on delete restrict,
  foreign key (incident_id, company_id) references public.incidents (id, company_id) on delete cascade,
  check ((moment = 'incident') = (incident_id is not null)),
  check ((lat is null) = (lng is null))
);

create index evidence_job_id_idx on public.evidence (job_id);

create table public.handover_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  job_id uuid not null,
  moment public.job_moment not null check (moment in ('pickup', 'delivery')),
  signer_name text not null check (length(btrim(signer_name)) between 1 and 120),
  -- Cuándo se firmó (escrito por la persona desde el panel).
  signed_at timestamptz not null,
  remarks text check (remarks is null or length(remarks) <= 1000),
  -- Firma dibujada en el móvil: obligatoria cuando venga de la app.
  signature_path text,
  -- Foto del acta firmada en papel (opcional desde el panel). Ruta en job-evidence.
  document_path text,
  source public.record_source not null,
  recorded_by uuid references public.company_users (id) on delete set null,
  recorded_at timestamptz not null default now(),
  foreign key (job_id, company_id) references public.jobs (id, company_id) on delete restrict,
  unique (job_id, moment),
  check (source = 'panel' or signature_path is not null)
);

-- =====================================================================
-- RLS: lectura para administradores; escritura solo por funciones
-- =====================================================================

alter table public.incidents enable row level security;
alter table public.evidence enable row level security;
alter table public.handover_records enable row level security;

revoke all on public.incidents, public.evidence, public.handover_records from anon, authenticated;
grant select on public.incidents, public.evidence, public.handover_records to authenticated;

create policy "administrators read their company incidents"
on public.incidents for select to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

create policy "administrators read their company evidence"
on public.evidence for select to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

create policy "administrators read their company handover records"
on public.handover_records for select to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

-- =====================================================================
-- RF-57: nada cambia después de cerrar el trabajo (también para las funciones)
-- =====================================================================

create or replace function public.block_closed_job_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_job_id uuid := case when tg_op = 'DELETE' then old.job_id else new.job_id end;
begin
  if exists (select 1 from public.jobs j where j.id = v_job_id and j.status = 'closed') then
    raise exception 'job closed' using errcode = '55000';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger incidents_block_closed before insert or update or delete on public.incidents
for each row execute function public.block_closed_job_changes();
create trigger evidence_block_closed before insert or update or delete on public.evidence
for each row execute function public.block_closed_job_changes();
create trigger handover_records_block_closed before insert or update or delete on public.handover_records
for each row execute function public.block_closed_job_changes();

-- El trabajo cerrado tampoco cambia, ni sus asignaciones.
create or replace function public.block_closed_job_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'closed' then
    raise exception 'job closed' using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger jobs_block_closed before update on public.jobs
for each row execute function public.block_closed_job_update();
create trigger assignments_block_closed before insert or update or delete on public.assignments
for each row execute function public.block_closed_job_changes();

-- =====================================================================
-- Storage: bucket privado job-evidence (RNF-05)
-- =====================================================================

-- Fotos del trabajo y fotos de actas en papel. Ruta: <company_id>/<job_id>/<archivo>. La app del panel comprime
-- antes de subir; el límite es 5 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('job-evidence', 'job-evidence', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "administrators read their company job evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'job-evidence'
  and (storage.foldername(name))[1] = (select public.current_company_id())::text
  and (select public.is_company_administrator())
);

-- Solo en trabajos de la empresa que no están cerrados ni cancelados.
create policy "administrators upload their company job evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'job-evidence'
  and (storage.foldername(name))[1] = (select public.current_company_id())::text
  and (select public.is_company_administrator())
  and exists (
    select 1 from public.jobs j
    where j.id::text = (storage.foldername(name))[2]
      and j.company_id = (select public.current_company_id())
      and j.status not in ('closed', 'cancelled')
  )
);

-- Borrar un fichero solo antes del cierre (el registro se elimina antes con delete_job_record).
create policy "administrators delete their company job evidence before closing"
on storage.objects for delete to authenticated
using (
  bucket_id = 'job-evidence'
  and (storage.foldername(name))[1] = (select public.current_company_id())::text
  and (select public.is_company_administrator())
  and exists (
    select 1 from public.jobs j
    where j.id::text = (storage.foldername(name))[2]
      and j.company_id = (select public.current_company_id())
      and j.status <> 'closed'
  )
);

-- =====================================================================
-- Funciones del administrador
-- =====================================================================

-- Comprueba sesión, rol y trabajo de la empresa, y que se puede registrar en él. Devuelve el trabajo bloqueado.
-- Errores: 42501 sin permiso; P0002 trabajo de otra empresa o inexistente; 55000 trabajo cerrado o cancelado.
create or replace function public.lock_open_job(p_job_id uuid)
returns public.jobs
language plpgsql
set search_path = ''
as $$
declare
  v_job public.jobs%rowtype;
begin
  if (select auth.uid()) is null or (select public.current_company_id()) is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into v_job from public.jobs where id = p_job_id and company_id = (select public.current_company_id()) for update;
  if not found then
    raise exception 'job not found' using errcode = 'P0002';
  end if;
  if v_job.status in ('closed', 'cancelled') then
    raise exception 'job not open' using errcode = '55000';
  end if;
  return v_job;
end;
$$;

revoke all on function public.lock_open_job(uuid) from public, anon, authenticated;

-- Una ruta del bucket es de este trabajo: <company_id>/<job_id>/<archivo>.
create or replace function public.is_job_file(p_job public.jobs, p_path text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_path is not null and p_path like p_job.company_id::text || '/' || p_job.id::text || '/_%' and p_path !~ '\.\.';
$$;

revoke all on function public.is_job_file(public.jobs, text) from public, anon, authenticated;

-- Evento en el historial del envío del trabajo.
create or replace function public.add_job_event(p_job public.jobs, p_kind public.shipment_event_kind, p_data jsonb)
returns void
language sql
set search_path = ''
as $$
  insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
  values (
    p_job.company_id, p_job.shipment_id, p_kind, 'company', (select auth.uid()),
    p_data || jsonb_build_object('by', (select cu.name from public.company_users cu where cu.id = (select auth.uid())))
  );
$$;

revoke all on function public.add_job_event(public.jobs, public.shipment_event_kind, jsonb) from public, anon, authenticated;

-- RF-51, RF-55: foto de recogida, entrega o de una incidencia. El fichero ya está subido al bucket.
-- 22023 si la ruta no es de este trabajo o la incidencia no es suya.
create or replace function public.add_evidence(
  p_job_id uuid,
  p_moment public.job_moment,
  p_file_path text,
  p_taken_at timestamptz,
  p_incident_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.jobs := public.lock_open_job(p_job_id);
  v_id uuid;
begin
  if p_moment is null or p_taken_at is null or not public.is_job_file(v_job, p_file_path) then
    raise exception 'invalid evidence' using errcode = '22023';
  end if;
  if (p_moment = 'incident') <> (p_incident_id is not null)
     or (p_incident_id is not null and not exists (select 1 from public.incidents i where i.id = p_incident_id and i.job_id = p_job_id)) then
    raise exception 'invalid incident' using errcode = '22023';
  end if;

  insert into public.evidence (company_id, job_id, moment, incident_id, file_path, taken_at, source, recorded_by)
  values (v_job.company_id, p_job_id, p_moment, p_incident_id, p_file_path, p_taken_at, 'panel', (select auth.uid()))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.add_evidence(uuid, public.job_moment, text, timestamptz, uuid) from public, anon;
grant execute on function public.add_evidence(uuid, public.job_moment, text, timestamptz, uuid) to authenticated;

-- RF-52 y RF-55: acta de recogida (programado → en curso) o de entrega (en curso → entregado).
-- La entrega exige la recogida. 55000 si el trabajo no está en el estado que toca; 23505 si el acta ya existe.
create or replace function public.record_handover(
  p_job_id uuid,
  p_moment public.job_moment,
  p_signer_name text,
  p_signed_at timestamptz,
  p_remarks text,
  p_document_path text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.jobs := public.lock_open_job(p_job_id);
  v_id uuid;
begin
  if p_moment not in ('pickup', 'delivery') or p_signed_at is null
     or (p_document_path is not null and not public.is_job_file(v_job, p_document_path)) then
    raise exception 'invalid handover' using errcode = '22023';
  end if;
  if (p_moment = 'pickup' and v_job.status <> 'scheduled') or (p_moment = 'delivery' and v_job.status <> 'in_progress') then
    raise exception 'wrong job status' using errcode = '55000';
  end if;

  insert into public.handover_records (company_id, job_id, moment, signer_name, signed_at, remarks, document_path, source, recorded_by)
  values (
    v_job.company_id, p_job_id, p_moment, btrim(coalesce(p_signer_name, '')), p_signed_at,
    nullif(btrim(coalesce(p_remarks, '')), ''), p_document_path, 'panel', (select auth.uid())
  )
  returning id into v_id;

  update public.jobs set status = case when p_moment = 'pickup' then 'in_progress'::public.job_status else 'delivered'::public.job_status end
  where id = p_job_id;

  perform public.add_job_event(
    v_job,
    case when p_moment = 'pickup' then 'pickup_recorded'::public.shipment_event_kind else 'delivery_recorded'::public.shipment_event_kind end,
    jsonb_build_object('signer', btrim(p_signer_name), 'signedAt', p_signed_at)
  );
  return v_id;
end;
$$;

revoke all on function public.record_handover(uuid, public.job_moment, text, timestamptz, text, text) from public, anon;
grant execute on function public.record_handover(uuid, public.job_moment, text, timestamptz, text, text) to authenticated;

-- RF-53: incidencia durante la mudanza (en curso o entregada).
create or replace function public.report_incident(
  p_job_id uuid,
  p_type public.incident_type,
  p_description text,
  p_extra_amount_cents bigint,
  p_occurred_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.jobs := public.lock_open_job(p_job_id);
  v_id uuid;
begin
  if v_job.status not in ('in_progress', 'delivered') then
    raise exception 'wrong job status' using errcode = '55000';
  end if;
  if p_type is null or p_occurred_at is null then
    raise exception 'missing value' using errcode = '22023';
  end if;

  insert into public.incidents (company_id, job_id, type, description, extra_amount_cents, occurred_at, source, recorded_by)
  values (v_job.company_id, p_job_id, p_type, btrim(coalesce(p_description, '')), coalesce(p_extra_amount_cents, 0), p_occurred_at, 'panel', (select auth.uid()))
  returning id into v_id;

  perform public.add_job_event(v_job, 'incident_reported', jsonb_build_object('type', p_type, 'extraAmountCents', coalesce(p_extra_amount_cents, 0)));
  return v_id;
end;
$$;

revoke all on function public.report_incident(uuid, public.incident_type, text, bigint, timestamptz) from public, anon;
grant execute on function public.report_incident(uuid, public.incident_type, text, bigint, timestamptz) to authenticated;

-- P10: resolver una incidencia con una nota. Sin incidencias abiertas se puede cerrar el trabajo (RF-59).
create or replace function public.resolve_incident(p_incident_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job_id uuid;
  v_job public.jobs;
begin
  select job_id into v_job_id from public.incidents
  where id = p_incident_id and company_id = (select public.current_company_id()) and status = 'open';
  if v_job_id is null then
    raise exception 'incident not found' using errcode = 'P0002';
  end if;
  v_job := public.lock_open_job(v_job_id);

  update public.incidents
  set status = 'resolved', resolution_note = btrim(coalesce(p_note, '')), resolved_at = now(), resolved_by = (select auth.uid())
  where id = p_incident_id;

  perform public.add_job_event(v_job, 'incident_resolved', jsonb_build_object('incidentId', p_incident_id));
end;
$$;

revoke all on function public.resolve_incident(uuid, text) from public, anon;
grant execute on function public.resolve_incident(uuid, text) to authenticated;

-- P9: elimina una foto, un acta o una incidencia registrada desde el panel por error, antes del cierre.
-- Quitar el acta de entrega devuelve el trabajo a "en curso"; quitar la de recogida, a "programado" (solo si no hay
-- entrega ni incidencias). Devuelve las rutas de los ficheros que el panel debe borrar del bucket.
create or replace function public.delete_job_record(p_kind text, p_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job_id uuid;
  v_job public.jobs;
  v_paths text[];
  v_moment public.job_moment;
begin
  v_job_id := case p_kind
    when 'evidence' then (select job_id from public.evidence where id = p_id and company_id = (select public.current_company_id()) and source = 'panel')
    when 'incident' then (select job_id from public.incidents where id = p_id and company_id = (select public.current_company_id()) and source = 'panel')
    when 'handover' then (select job_id from public.handover_records where id = p_id and company_id = (select public.current_company_id()) and source = 'panel')
  end;
  if v_job_id is null then
    raise exception 'record not found' using errcode = 'P0002';
  end if;
  v_job := public.lock_open_job(v_job_id);

  if p_kind = 'evidence' then
    delete from public.evidence where id = p_id returning array[file_path] into v_paths;
  elsif p_kind = 'incident' then
    select coalesce(array_agg(file_path), '{}') into v_paths from public.evidence where incident_id = p_id;
    -- Sus fotos se borran en cascada
    delete from public.incidents where id = p_id;
  else
    select moment into v_moment from public.handover_records where id = p_id;
    if v_moment = 'pickup' and (v_job.status <> 'in_progress'
        or exists (select 1 from public.incidents where job_id = v_job_id)) then
      raise exception 'pickup in use' using errcode = '55000';
    end if;
    if v_moment = 'delivery' and v_job.status <> 'delivered' then
      raise exception 'wrong job status' using errcode = '55000';
    end if;
    delete from public.handover_records where id = p_id returning array_remove(array[document_path], null) into v_paths;
    update public.jobs set status = case when v_moment = 'pickup' then 'scheduled'::public.job_status else 'in_progress'::public.job_status end
    where id = v_job_id;
  end if;

  perform public.add_job_event(v_job, 'job_record_deleted', jsonb_build_object('record', p_kind, 'moment', v_moment));
  return coalesce(v_paths, '{}');
end;
$$;

revoke all on function public.delete_job_record(text, uuid) from public, anon;
grant execute on function public.delete_job_record(text, uuid) to authenticated;
