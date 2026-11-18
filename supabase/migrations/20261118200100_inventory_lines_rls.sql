-- Paso 4b · Líneas del inventario y correcciones: seguridad de filas (RNF-01, RNF-03).
--
-- Solo lectura desde la app. Las escrituras pasan por las funciones de 20261118200200_inventory_functions.sql.
-- Las líneas son del pedido: las lee el administrador de una empresa con envío en ese pedido (can_read_order,
-- paso 4a). Las correcciones son de cada empresa: solo las lee la empresa que las hizo.

alter table public.inventory_lines enable row level security;
alter table public.inventory_line_adjustments enable row level security;

revoke all on public.inventory_lines, public.inventory_line_adjustments from anon, authenticated;
grant select on public.inventory_lines, public.inventory_line_adjustments to authenticated;

create policy "administrators read inventory lines of their orders"
on public.inventory_lines for select
to authenticated
using (public.can_read_order(order_id));

create policy "administrators read their company line adjustments"
on public.inventory_line_adjustments for select
to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));
