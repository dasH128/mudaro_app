-- Paso 2/4 · Empresas del piloto (RF-65 a RF-68).
--
-- El estado de la empresa (convite pendente, em configuração, ativa, desativada)
-- no se guarda: se calcula (RF-66). Aquí solo viven los datos de los que depende.
-- Las reglas de formato de email y teléfono se validan en servidor con zod.

-- NIF portugués: 9 dígitos con dígito de control módulo 11 (RF-65).
-- No restringe el primer dígito, para admitir empresarios en nombre individual.
create or replace function public.is_valid_nif(nif text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  total integer := 0;
  check_digit integer;
begin
  if nif is null or nif !~ '^[0-9]{9}$' then
    return false;
  end if;

  for i in 1..8 loop
    total := total + substring(nif, i, 1)::integer * (10 - i);
  end loop;

  check_digit := 11 - mod(total, 11);
  if check_digit >= 10 then
    check_digit := 0;
  end if;

  return check_digit = substring(nif, 9, 1)::integer;
end;
$$;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  trade_name text not null check (length(btrim(trade_name)) > 0),
  -- País del identificador fiscal (ISO 3166-1 alfa-2). El MVP es solo para Portugal,
  -- de ahí el valor por defecto; al abrir otros países se quita y el alta lo exige.
  country_code char(2) not null default 'PT' check (country_code ~ '^[A-Z]{2}$'),
  -- Identificador fiscal de la empresa (en Portugal, el NIF; en Perú, el RUC).
  tax_id text not null check (length(btrim(tax_id)) > 0),
  phone text,
  general_email text,
  base_address text,
  logo_path text,

  -- Licencia IMT y contrato RGPD (RNF-04): se puede crear la empresa sin ellos,
  -- pero no se considera activa hasta tenerlos. La fecha rellena equivale a la casilla marcada.
  imt_reference text,
  imt_verified_on date check (imt_verified_on is null or imt_verified_on <= current_date),
  gdpr_version text,
  gdpr_signed_on date check (gdpr_signed_on is null or gdpr_signed_on <= current_date),

  -- RF-68: desactivar exige motivo; reactivar deja ambos campos a null.
  deactivated_at timestamptz,
  deactivation_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- El identificador se repite entre países, así que la unicidad es por país.
  constraint companies_country_tax_id_key unique (country_code, tax_id),

  -- Solo hay validación del dígito de control para Portugal. Para otros países
  -- se validará en servidor con zod cuando se abran.
  constraint companies_tax_id_valid check (
    country_code <> 'PT' or public.is_valid_nif(tax_id)
  ),

  constraint companies_deactivation_requires_reason check (
    (deactivated_at is null and deactivation_reason is null)
    or (deactivated_at is not null and length(btrim(deactivation_reason)) > 0)
  )
);

create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;

revoke all on public.companies from anon, authenticated;
grant select on public.companies to authenticated;

-- La política de lectura para los miembros de la empresa se crea en la migración
-- de usuarios, cuando existe current_company_id().
create policy "platform users read companies"
on public.companies for select
to authenticated
using (public.is_platform_user());

-- Datos que solo ve el equipo Mudaro. Van aparte porque RLS filtra filas, no columnas,
-- y una empresa no debe leer sus propias notas internas.
create table public.company_internal (
  company_id uuid primary key references public.companies (id) on delete cascade,
  region text,   -- lista cerrada por definir (decisión abierta del requisito)
  source text,
  notes text,
  updated_at timestamptz not null default now()
);

create trigger company_internal_set_updated_at
before update on public.company_internal
for each row execute function public.set_updated_at();

alter table public.company_internal enable row level security;

revoke all on public.company_internal from anon, authenticated;
grant select on public.company_internal to authenticated;

create policy "platform users read company internal data"
on public.company_internal for select
to authenticated
using (public.is_platform_user());
