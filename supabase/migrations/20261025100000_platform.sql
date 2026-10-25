-- Paso 1/4 · Equipo Mudaro (rol de plataforma).
-- Ver docs/plan-modelo-bd.md, docs/architecture-system.md (sección Roles) y RNF-01.
--
-- Las tablas de este paso solo tienen políticas de lectura. Las escrituras pasan
-- por Edge Functions que validan el rol y usan la clave de servicio.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.platform_users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger platform_users_set_updated_at
before update on public.platform_users
for each row execute function public.set_updated_at();

alter table public.platform_users enable row level security;

revoke all on public.platform_users from anon, authenticated;
grant select on public.platform_users to authenticated;

-- true si la sesión es de un usuario de plataforma activo y con MFA verificado (aal2).
-- security definer: consulta platform_users sin pasar por su RLS (evita recursión).
create or replace function public.is_platform_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
    and exists (
      select 1
      from public.platform_users pu
      where pu.id = (select auth.uid())
        and pu.active
    );
$$;

revoke execute on function public.is_platform_user() from public, anon;
grant execute on function public.is_platform_user() to authenticated;

create policy "platform users read their own row"
on public.platform_users for select
to authenticated
using (id = (select auth.uid()) and public.is_platform_user());
