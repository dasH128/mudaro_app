-- Telemóvel do administrador, recolhido no alta de empresa (RF-65). Opcional.
--
-- Vive en el convite porque el administrador aún no tiene fila en company_users hasta aceptar.
-- Mismo formato que el formulario: 9 dígitos, prefijo +351 opcional, espacios permitidos.
alter table public.invitations
  add column phone text
  check (phone is null or regexp_replace(phone, '\s', '', 'g') ~ '^(\+351)?[0-9]{9}$');
