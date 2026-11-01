-- Paso 2 · Vehículos de la empresa (RF-05, RNF-01, RNF-03, RNF-08).
--
-- El coste por km va en una tabla aparte: la RLS filtra filas, no columnas, y el operario puede leer los
-- vehículos de su empresa (la app móvil los necesita) pero nunca los costes (RNF-03).
-- Sin fila en vehicle_costs = "falta el coste por km".

create type public.vehicle_type as enum ('small-van', 'van', 'medium-truck', 'large-truck', 'other');
create type public.vehicle_inactive_reason as enum ('workshop', 'other');

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  type public.vehicle_type not null,
  -- Matrícula portuguesa normalizada (AA-00-AA). La normaliza create_vehicle.
  plate text not null check (plate ~ '^[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$'),
  -- Nombre corto opcional ("Camião 1").
  name text check (name is null or length(btrim(name)) between 1 and 60),
  capacity_m3 numeric(6,2) not null check (capacity_m3 > 0 and capacity_m3 <= 200),
  max_load_kg integer check (max_load_kg is null or (max_load_kg > 0 and max_load_kg <= 40000)),
  -- Un vehículo inactivo no se propone en cálculos ni en la agenda (RF-05).
  active boolean not null default true,
  inactive_reason public.vehicle_inactive_reason,
  inactive_since date,
  inactive_by uuid references public.company_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, plate),
  check ((active and inactive_reason is null and inactive_since is null)
      or (not active and inactive_reason is not null and inactive_since is not null))
);

create trigger vehicles_set_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

-- Coste por km en céntimos (el dominio de la app usa céntimos). company_id evita un join en la política RLS.
create table public.vehicle_costs (
  vehicle_id uuid primary key references public.vehicles (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  cost_per_km_cents integer not null check (cost_per_km_cents >= 0 and cost_per_km_cents <= 2000),
  updated_at timestamptz not null default now()
);

create index vehicle_costs_company_id_idx on public.vehicle_costs (company_id);

create trigger vehicle_costs_set_updated_at
before update on public.vehicle_costs
for each row execute function public.set_updated_at();

-- Verdadero si quien llama es administrador activo de una empresa activa.
-- security definer: consulta company_users sin pasar por su RLS.
create or replace function public.is_company_administrator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_users cu
    where cu.id = (select auth.uid())
      and cu.active
      and cu.role = 'administrator'
      and cu.company_id = (select public.current_company_id())
  );
$$;

revoke execute on function public.is_company_administrator() from public, anon;
grant execute on function public.is_company_administrator() to authenticated;

alter table public.vehicles enable row level security;
alter table public.vehicle_costs enable row level security;

-- Solo lectura desde la app: las altas pasan por create_vehicle.
revoke all on public.vehicles, public.vehicle_costs from anon, authenticated;
grant select on public.vehicles, public.vehicle_costs to authenticated;

create policy "members read their company vehicles"
on public.vehicles for select
to authenticated
using (company_id = (select public.current_company_id()));

create policy "administrators read their company vehicle costs"
on public.vehicle_costs for select
to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

-- El histórico del vehículo sale de audit_log: el administrador lee los eventos de vehículos de su empresa.
create policy "administrators read their company vehicle audit log"
on public.audit_log for select
to authenticated
using (
  entity = 'vehicle'
  and company_id = (select public.current_company_id())
  and (select public.is_company_administrator())
);

-- Da de alta un vehículo con su coste y deja el rastro de auditoría, todo en una transacción (RF-05, RNF-08).
-- La empresa y el actor salen de la sesión, nunca de un parámetro. Solo el administrador puede llamarla.
-- Una matrícula repetida en la empresa lanza unique_violation (23505).
create or replace function public.create_vehicle(
  p_type public.vehicle_type,
  p_plate text,
  p_name text,
  p_capacity_m3 numeric,
  p_max_load_kg integer,
  p_cost_per_km_cents integer,
  p_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_plate text := upper(regexp_replace(coalesce(p_plate, ''), '[\s-]', '', 'g'));
  v_actor_name text;
  v_vehicle_id uuid;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if v_plate !~ '^[A-Z0-9]{6}$' then
    raise exception 'invalid plate' using errcode = '22023';
  end if;
  v_plate := substr(v_plate, 1, 2) || '-' || substr(v_plate, 3, 2) || '-' || substr(v_plate, 5, 2);

  select name into v_actor_name from public.company_users where id = v_user_id;

  insert into public.vehicles (
    company_id, type, plate, name, capacity_m3, max_load_kg,
    active, inactive_reason, inactive_since, inactive_by
  ) values (
    v_company_id, p_type, v_plate, nullif(btrim(coalesce(p_name, '')), ''), p_capacity_m3, p_max_load_kg,
    p_active,
    case when p_active then null else 'other'::public.vehicle_inactive_reason end,
    case when p_active then null else (now() at time zone 'Europe/Lisbon')::date end,
    case when p_active then null else v_user_id end
  )
  returning id into v_vehicle_id;

  insert into public.vehicle_costs (vehicle_id, company_id, cost_per_km_cents)
  values (v_vehicle_id, v_company_id, p_cost_per_km_cents);

  -- El nombre de quien actúa se guarda en el evento: el histórico no depende de que la cuenta siga existiendo.
  insert into public.audit_log (actor_id, actor_type, company_id, action, entity, entity_id, data)
  values (
    v_user_id, 'company', v_company_id, 'vehicle_created', 'vehicle', v_vehicle_id::text,
    jsonb_build_object('by', v_actor_name, 'withoutCost', false)
  );

  return v_vehicle_id;
end;
$$;

revoke all on function public.create_vehicle(public.vehicle_type, text, text, numeric, integer, integer, boolean) from public, anon;
grant execute on function public.create_vehicle(public.vehicle_type, text, text, numeric, integer, integer, boolean) to authenticated;
