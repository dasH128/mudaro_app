-- Paso 3/4 · Usuarios de empresa e invitaciones (RF-03, RF-04, RF-65, RF-67).
--
-- Decisión: un usuario pertenece a una sola empresa (la clave primaria es el id de Auth).
-- La decisión abierta "operario en varias empresas" exigiría una tabla intermedia.

create type public.company_role as enum ('administrator', 'operator');

create table public.company_users (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete restrict,
  role public.company_role not null,
  name text not null check (length(btrim(name)) > 0),
  phone text,
  active boolean not null default true,  -- RF-04: un usuario inactivo no puede entrar
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lo usan las políticas RLS en cada consulta.
create index company_users_company_id_idx on public.company_users (company_id);

create trigger company_users_set_updated_at
before update on public.company_users
for each row execute function public.set_updated_at();

alter table public.company_users enable row level security;

revoke all on public.company_users from anon, authenticated;
grant select on public.company_users to authenticated;

-- Empresa de la sesión, o null si el usuario está inactivo o su empresa está desactivada
-- (RF-04, RF-68: los usuarios de una empresa desactivada no pueden entrar).
-- security definer: consulta company_users y companies sin pasar por su RLS.
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select cu.company_id
  from public.company_users cu
  join public.companies c on c.id = cu.company_id
  where cu.id = (select auth.uid())
    and cu.active
    and c.deactivated_at is null;
$$;

revoke execute on function public.current_company_id() from public, anon;
grant execute on function public.current_company_id() to authenticated;

create policy "users read their own row"
on public.company_users for select
to authenticated
using (id = (select auth.uid()));

create policy "members read their company users"
on public.company_users for select
to authenticated
using (company_id = (select public.current_company_id()));

create policy "platform users read company users"
on public.company_users for select
to authenticated
using (public.is_platform_user());

-- Política pendiente de la migración de empresas.
create policy "members read their company"
on public.companies for select
to authenticated
using (id = (select public.current_company_id()));

-- Invitaciones (RF-03, RF-65, RF-67). Sirven para el administrador y para los operarios.
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  email text not null,
  name text not null check (length(btrim(name)) > 0),
  role public.company_role not null,
  -- sha256 del token (mínimo 32 bytes aleatorios, RNF-02). El token en claro solo existe en el enlace.
  token_hash text not null unique,
  -- null mientras el equipo no ha enviado el email (casilla "Enviar o convite por email agora").
  sent_at timestamptz,
  -- 7 días es un valor provisional (decisión abierta del requisito).
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invitations_company_id_idx on public.invitations (company_id);

-- Una sola invitación pendiente de administrador por empresa.
-- "Generar enlace nuevo" revoca la anterior antes de crear la siguiente.
create unique index invitations_pending_administrator_idx
on public.invitations (company_id)
where role = 'administrator' and accepted_at is null and revoked_at is null;

create trigger invitations_set_updated_at
before update on public.invitations
for each row execute function public.set_updated_at();

alter table public.invitations enable row level security;

revoke all on public.invitations from anon, authenticated;
grant select on public.invitations to authenticated;

-- Solo plataforma. Los administradores de empresa invitan a través de una Edge Function.
create policy "platform users read invitations"
on public.invitations for select
to authenticated
using (public.is_platform_user());
