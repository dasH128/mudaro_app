-- Paso 2/4 · Renombrado de la validación del NIF a inglés.
--
-- La función y su parámetro se llamaban is_valid_nif(nif). Se sustituyen por
-- is_valid_tax_id(tax_id), con la misma lógica, y se reemplaza la restricción
-- que la usa. Postgres no permite renombrar un parámetro con CREATE OR REPLACE,
-- por eso se crea la función nueva y se elimina la antigua.

create or replace function public.is_valid_tax_id(tax_id text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  total integer := 0;
  check_digit integer;
begin
  if tax_id is null or tax_id !~ '^[0-9]{9}$' then
    return false;
  end if;

  for i in 1..8 loop
    total := total + substring(tax_id, i, 1)::integer * (10 - i);
  end loop;

  check_digit := 11 - mod(total, 11);
  if check_digit >= 10 then
    check_digit := 0;
  end if;

  return check_digit = substring(tax_id, 9, 1)::integer;
end;
$$;

alter table public.companies drop constraint companies_tax_id_valid;

alter table public.companies add constraint companies_tax_id_valid check (
  country_code <> 'PT' or public.is_valid_tax_id(tax_id)
);

drop function public.is_valid_nif(text);
