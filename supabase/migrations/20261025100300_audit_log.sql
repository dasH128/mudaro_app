-- Paso 4/4 · Registro de auditoría (RNF-08).
-- Altas, invitaciones y cambios de estado de empresas (architecture-system.md).
--
-- Solo lo escriben las Edge Functions con la clave de servicio, que omite RLS.
-- Ningún rol de la app tiene permiso de escritura.

create table public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  -- Sin claves foráneas: el registro debe sobrevivir a la cuenta o a la empresa.
  actor_id uuid,
  actor_type text not null check (actor_type in ('platform', 'company', 'system')),
  company_id uuid,
  action text not null check (length(btrim(action)) > 0),
  entity text not null check (length(btrim(entity)) > 0),
  entity_id text not null,
  data jsonb not null default '{}'::jsonb
);

create index audit_log_company_id_occurred_at_idx
on public.audit_log (company_id, occurred_at desc);

create or replace function public.block_audit_log_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log is immutable (%)', tg_op;
end;
$$;

create trigger audit_log_block_update_delete
before update or delete on public.audit_log
for each row execute function public.block_audit_log_changes();

create trigger audit_log_block_truncate
before truncate on public.audit_log
for each statement execute function public.block_audit_log_changes();

alter table public.audit_log enable row level security;

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

create policy "platform users read audit log"
on public.audit_log for select
to authenticated
using (public.is_platform_user());
