-- Paso 5 · Alta de empresa desde la Edge Function `create-company` (RF-65, RF-67).
--
-- Con Supabase Auth (architecture-system.md), el enlace del convite lo genera Auth,
-- así que el hash del token propio deja de ser obligatorio. Se conserva la columna
-- por si más adelante se usa para operarios con token propio.
alter table public.invitations alter column token_hash drop not null;

-- Crea empresa, datos internos, convite pendiente y su registro de auditoría en una sola transacción.
-- El email del administrador lo envía la Edge Function después (con sent_at a null hasta entonces).
-- Solo la clave de servicio puede ejecutarla: la Edge Function valida antes el rol de plataforma.
create or replace function public.create_company_with_invitation(
  p_company jsonb,
  p_admin jsonb,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
  v_invitation_id uuid;
begin
  insert into public.companies (
    trade_name,
    tax_id,
    phone,
    general_email,
    base_address,
    imt_reference,
    imt_verified_on,
    gdpr_version,
    gdpr_signed_on
  ) values (
    p_company ->> 'name',
    p_company ->> 'taxId',
    nullif(p_company ->> 'phone', ''),
    nullif(p_company ->> 'emailGeneral', ''),
    nullif(p_company ->> 'address', ''),
    nullif(p_company ->> 'imtReference', ''),
    -- La fecha solo se guarda si la casilla IMT está marcada, como indica companies.sql.
    case when (p_company ->> 'imtVerified')::boolean then (p_company ->> 'imtVerifiedAt')::date end,
    nullif(p_company ->> 'gdprVersion', ''),
    case when (p_company ->> 'gdprSigned')::boolean then (p_company ->> 'gdprSignedAt')::date end
  )
  returning id into v_company_id;

  insert into public.company_internal (company_id, region, source, notes)
  values (
    v_company_id,
    nullif(p_company ->> 'region', ''),
    nullif(p_company ->> 'origin', ''),
    nullif(p_company ->> 'notes', '')
  );

  insert into public.invitations (company_id, email, name, role, phone)
  values (
    v_company_id,
    p_admin ->> 'email',
    p_admin ->> 'name',
    'administrator',
    nullif(p_admin ->> 'mobile', '')
  )
  returning id into v_invitation_id;

  insert into public.audit_log (actor_id, actor_type, company_id, action, entity, entity_id)
  values (p_actor_id, 'platform', v_company_id, 'company_created', 'company', v_company_id::text);

  return jsonb_build_object('company_id', v_company_id, 'invitation_id', v_invitation_id);
end;
$$;

revoke all on function public.create_company_with_invitation(jsonb, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.create_company_with_invitation(jsonb, jsonb, uuid) to service_role;
