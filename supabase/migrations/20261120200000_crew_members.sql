-- Paso 6.0b · Personas del equipo de la empresa (plan del paso 6, P2 y P3; RNF-01, RNF-08).
--
-- En el MVP el equipo no usa ninguna app: el administrador da de alta a sus personas (motoristas, carregadores,
-- chefes de equipa) sin cuenta y las asigna a los trabajos desde el panel. Cuando exista la app del operario, a la
-- persona se le vincula su cuenta (user_id) y conserva su historial.

-- Función de la persona. No da permisos: solo informa al asignar.
create type public.crew_position as enum ('driver', 'loader', 'foreman');
-- Motivo de una persona inactiva: ya no trabaja en la empresa u otro.
create type public.crew_inactive_reason as enum ('left', 'other');

create table public.crew_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  -- Teléfono portugués normalizado (+351 y 9 cifras), como el de los clientes. Opcional: sin él se avisa en el panel.
  phone text check (phone is null or phone ~ '^\+351[0-9]{9}$'),
  position public.crew_position not null,
  -- Una persona inactiva no se puede asignar a trabajos (paso 6.1).
  active boolean not null default true,
  inactive_reason public.crew_inactive_reason,
  inactive_since date,
  inactive_by uuid references public.company_users (id) on delete set null,
  -- Cuenta de la app del operario, cuando exista. Una cuenta es como mucho una persona.
  user_id uuid unique references public.company_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Para claves compuestas con company_id desde las asignaciones (paso 6.1).
  unique (company_id, id),
  check ((active and inactive_reason is null and inactive_since is null)
      or (not active and inactive_reason is not null and inactive_since is not null))
);

create trigger crew_members_set_updated_at
before update on public.crew_members
for each row execute function public.set_updated_at();

alter table public.crew_members enable row level security;

-- Solo lectura desde la app: las escrituras pasan por las funciones de abajo.
revoke all on public.crew_members from anon, authenticated;
grant select on public.crew_members to authenticated;

create policy "administrators read their company crew"
on public.crew_members for select
to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

-- El histórico de la persona sale de audit_log.
create policy "administrators read their company crew audit log"
on public.audit_log for select
to authenticated
using (
  entity = 'crew_member'
  and company_id = (select public.current_company_id())
  and (select public.is_company_administrator())
);

-- Da de alta una persona del equipo. La empresa y el actor salen de la sesión. Solo el administrador.
create or replace function public.create_crew_member(
  p_name text,
  p_phone text,
  p_position public.crew_position
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_actor_name text;
  v_id uuid;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_position is null then
    raise exception 'missing value' using errcode = '22023';
  end if;

  select name into v_actor_name from public.company_users where id = v_user_id;

  -- El nombre vacío y un teléfono mal formado los rechazan las restricciones de la tabla (23514).
  insert into public.crew_members (company_id, name, phone, position)
  values (v_company_id, btrim(coalesce(p_name, '')), nullif(btrim(coalesce(p_phone, '')), ''), p_position)
  returning id into v_id;

  insert into public.audit_log (actor_id, actor_type, company_id, action, entity, entity_id, data)
  values (
    v_user_id, 'company', v_company_id, 'crew_member_created', 'crew_member', v_id::text,
    jsonb_build_object('by', v_actor_name, 'withoutPhone', nullif(btrim(coalesce(p_phone, '')), '') is null)
  );

  return v_id;
end;
$$;

revoke all on function public.create_crew_member(text, text, public.crew_position) from public, anon;
grant execute on function public.create_crew_member(text, text, public.crew_position) to authenticated;

-- Guarda nombre, teléfono y función. Registra un evento por dato cambiado. Otra empresa o inexistente: P0002.
create or replace function public.update_crew_member(
  p_id uuid,
  p_name text,
  p_phone text,
  p_position public.crew_position
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
  v_old public.crew_members%rowtype;
  v_name text := btrim(coalesce(p_name, ''));
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_position is null then
    raise exception 'missing value' using errcode = '22023';
  end if;

  select * into v_old
  from public.crew_members
  where id = p_id and company_id = v_company_id
  for update;

  if not found then
    raise exception 'crew member not found' using errcode = 'P0002';
  end if;

  select name into v_actor_name from public.company_users where id = v_user_id;

  update public.crew_members
  set name = v_name, phone = v_phone, position = p_position
  where id = p_id
    and (name, phone, position) is distinct from (v_name, v_phone, p_position);

  insert into public.audit_log (actor_id, actor_type, company_id, action, entity, entity_id, data)
  select v_user_id, 'company', v_company_id, change.action, 'crew_member', p_id::text,
         change.data || jsonb_build_object('by', v_actor_name)
  from (
    values
      ('crew_member_renamed', v_old.name is distinct from v_name,
       jsonb_build_object('from', v_old.name, 'to', v_name)),
      ('crew_member_phone_changed', v_old.phone is distinct from v_phone,
       jsonb_build_object('from', v_old.phone, 'to', v_phone)),
      ('crew_member_position_changed', v_old.position is distinct from p_position,
       jsonb_build_object('from', v_old.position, 'to', p_position))
  ) as change (action, changed, data)
  where change.changed;
end;
$$;

revoke all on function public.update_crew_member(uuid, text, text, public.crew_position) from public, anon;
grant execute on function public.update_crew_member(uuid, text, text, public.crew_position) to authenticated;

-- Activa o desactiva una persona. Desactivar exige motivo. Sin cambio de estado no hace nada.
create or replace function public.set_crew_member_active(
  p_id uuid,
  p_active boolean,
  p_reason public.crew_inactive_reason
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
  from public.crew_members
  where id = p_id and company_id = v_company_id
  for update;

  if not found then
    raise exception 'crew member not found' using errcode = 'P0002';
  end if;

  if v_was_active = p_active then
    return;
  end if;

  select name into v_actor_name from public.company_users where id = v_user_id;

  update public.crew_members
  set active = p_active,
      inactive_reason = case when p_active then null else p_reason end,
      inactive_since = case when p_active then null else (now() at time zone 'Europe/Lisbon')::date end,
      inactive_by = case when p_active then null else v_user_id end
  where id = p_id;

  insert into public.audit_log (actor_id, actor_type, company_id, action, entity, entity_id, data)
  values (
    v_user_id, 'company', v_company_id,
    case when p_active then 'crew_member_reactivated' else 'crew_member_deactivated' end,
    'crew_member', p_id::text,
    case when p_active then jsonb_build_object('by', v_actor_name)
         else jsonb_build_object('by', v_actor_name, 'reason', p_reason) end
  );
end;
$$;

revoke all on function public.set_crew_member_active(uuid, boolean, public.crew_inactive_reason) from public, anon;
grant execute on function public.set_crew_member_active(uuid, boolean, public.crew_inactive_reason) to authenticated;
