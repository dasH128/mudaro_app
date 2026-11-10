-- Paso 4a · Pedidos y envíos: seguridad de filas (RNF-01, RNF-03).
--
-- Solo lectura desde la app. Las escrituras pasan por create_order() y cancel_order().
-- Lee solo el administrador de la empresa: el panel es solo para administradores y las políticas
-- del operario (sus trabajos asignados, RF-49) llegan con el paso 6.
--
-- Las tablas del pedido (orders, addresses, inventories, inventory_addresses) no tienen company_id:
-- una empresa las lee si tiene un envío en ese pedido. Así las políticas no cambian cuando un pedido
-- llegue a varias empresas.

alter table public.clients enable row level security;
alter table public.orders enable row level security;
alter table public.shipment_counters enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_notes enable row level security;
alter table public.shipment_events enable row level security;
alter table public.addresses enable row level security;
alter table public.inventories enable row level security;
alter table public.inventory_addresses enable row level security;

revoke all on
  public.clients, public.orders, public.shipment_counters, public.shipments, public.shipment_notes,
  public.shipment_events, public.addresses, public.inventories, public.inventory_addresses
from anon, authenticated;

-- shipment_counters es interno: sin permisos ni políticas para la app.
grant select on
  public.clients, public.orders, public.shipments, public.shipment_notes,
  public.shipment_events, public.addresses, public.inventories, public.inventory_addresses
to authenticated;

-- Verdadero si la empresa de la sesión tiene un envío en el pedido y quien llama es su administrador.
-- security definer: consulta shipments sin pasar por su RLS, para no encadenar políticas.
create or replace function public.can_read_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select public.is_company_administrator())
    and exists (
      select 1
      from public.shipments s
      where s.order_id = p_order_id
        and s.company_id = (select public.current_company_id())
    );
$$;

revoke execute on function public.can_read_order(uuid) from public, anon;
grant execute on function public.can_read_order(uuid) to authenticated;

create policy "administrators read their company clients"
on public.clients for select
to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

create policy "administrators read their company shipments"
on public.shipments for select
to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

create policy "administrators read their company shipment notes"
on public.shipment_notes for select
to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

create policy "administrators read their company shipment events"
on public.shipment_events for select
to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

create policy "administrators read orders with a shipment of their company"
on public.orders for select
to authenticated
using (public.can_read_order(id));

create policy "administrators read addresses of their orders"
on public.addresses for select
to authenticated
using (public.can_read_order(order_id));

create policy "administrators read inventories of their orders"
on public.inventories for select
to authenticated
using (public.can_read_order(order_id));

create policy "administrators read inventory addresses of their orders"
on public.inventory_addresses for select
to authenticated
using (public.can_read_order(order_id));
