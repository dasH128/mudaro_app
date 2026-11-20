-- Paso 5.5 · Bucket privado de firmas (P6, RF-43). Plan: docs/plan-paso-5-presupuestos.md.
--
-- La firma dibujada del cliente al aceptar un orçamento. Ruta: <company_id>/<quote_id>.png.
--   - Escribe solo la Edge Function `client-order` con la clave de servicio (el cliente no tiene sesión). Ninguna
--     política de insert, update ni delete: anon y authenticated no pueden subir ni borrar.
--   - Lee el administrador de la empresa del orçamento (para ver la firma en el detalle). El primer segmento de la
--     ruta es su empresa.
-- El plazo de conservación de firmas sigue abierto (requirement-mvp.md, sección 11).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('signatures', 'signatures', false, 262144, array['image/png'])
on conflict (id) do nothing;

create policy "administrators read their company signatures"
on storage.objects for select
to authenticated
using (
  bucket_id = 'signatures'
  and (storage.foldername(name))[1] = (select public.current_company_id())::text
  and (select public.is_company_administrator())
);
