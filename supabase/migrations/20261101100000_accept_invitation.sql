-- Aceptar la invitación de empresa (RF-03, RF-65, RNF-08).
--
-- El administrador no tiene fila en company_users hasta aceptar (ver 20261025100500). Esta función la crea
-- con la sesión de quien ha canjeado el enlace de Auth, sin necesidad de clave de servicio en Next.js.
--
-- security definer: escribe en company_users, invitations y audit_log, que no tienen políticas de escritura.
-- La identidad sale del JWT (auth.uid() y email verificado por el enlace de invitación), nunca de un parámetro.
create or replace function public.accept_invitation()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
  v_company_id uuid;
  v_invitation public.invitations;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- Idempotente: si la persona ya es usuaria de una empresa, no hay nada que aceptar.
  select company_id into v_company_id from public.company_users where id = v_user_id;
  if found then
    return v_company_id;
  end if;

  select * into v_invitation
  from public.invitations
  where lower(email) = v_email
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  -- Sin invitación vigente (caducada, revocada o inexistente).
  if not found then
    return null;
  end if;

  insert into public.company_users (id, company_id, role, name, phone)
  values (v_user_id, v_invitation.company_id, v_invitation.role, v_invitation.name, v_invitation.phone);

  update public.invitations set accepted_at = now() where id = v_invitation.id;

  insert into public.audit_log (actor_id, actor_type, company_id, action, entity, entity_id)
  values (v_user_id, 'company', v_invitation.company_id, 'invitation_accepted', 'invitation', v_invitation.id::text);

  return v_invitation.company_id;
end;
$$;

revoke all on function public.accept_invitation() from public, anon;
grant execute on function public.accept_invitation() to authenticated;
