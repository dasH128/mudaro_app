-- Paso 6.6 · Cierre del trabajo (RF-58, RF-59, RF-57, RNF-08). Plan: docs/plan-paso-6-trabajos.md.
--
-- El administrador cierra un trabajo entregado con las horas y los km reales (obligatorios, RF-58) y solo si no
-- quedan incidencias abiertas (RF-59). Al cerrar, los triggers del paso 6.4 bloquean cualquier cambio en el trabajo,
-- sus asignaciones, fotos, actas e incidencias (RF-57). Las horas reales alimentan la métrica de precisión del piloto.

alter type public.shipment_event_kind add value if not exists 'job_closed';

-- Errores: 42501 sin permiso; P0002 trabajo de otra empresa o inexistente; 55000 trabajo no entregado (o ya cerrado);
-- 23514 incidencias abiertas (detalle JSON con su número); 22023 horas o km fuera de los límites de la tabla.
create or replace function public.close_job(
  p_job_id uuid,
  p_actual_hours numeric,
  p_actual_km numeric,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_job public.jobs%rowtype;
  v_open integer;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_actual_hours is null or p_actual_km is null
     or p_actual_hours <= 0 or p_actual_hours > 48 or p_actual_km < 0 or p_actual_km > 5000 then
    raise exception 'invalid actuals' using errcode = '22023';
  end if;

  select * into v_job from public.jobs where id = p_job_id and company_id = v_company_id for update;
  if not found then
    raise exception 'job not found' using errcode = 'P0002';
  end if;
  if v_job.status <> 'delivered' then
    raise exception 'job not delivered' using errcode = '55000';
  end if;

  select count(*) into v_open from public.incidents where job_id = p_job_id and status = 'open';
  if v_open > 0 then
    raise exception 'open incidents' using errcode = '23514', detail = jsonb_build_object('open', v_open)::text;
  end if;

  update public.jobs
  set status = 'closed',
      actual_hours = round(p_actual_hours, 2),
      actual_km = round(p_actual_km, 1),
      notes = coalesce(nullif(btrim(coalesce(p_notes, '')), ''), notes),
      closed_at = now(),
      closed_by = v_user_id
  where id = p_job_id;

  insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
  values (
    v_company_id, v_job.shipment_id, 'job_closed', 'company', v_user_id,
    jsonb_build_object(
      'by', (select name from public.company_users where id = v_user_id),
      'actualHours', round(p_actual_hours, 2),
      'actualKm', round(p_actual_km, 1)
    )
  );
end;
$$;

revoke all on function public.close_job(uuid, numeric, numeric, text) from public, anon;
grant execute on function public.close_job(uuid, numeric, numeric, text) to authenticated;
