-- Paso 5.2 · Presupuestos ("Orçamentos"): tablas, RLS y funciones (RF-35 a RF-46). Plan: docs/plan-paso-5-presupuestos.md.
--
-- Decisiones (19/11/2026):
--   - Líneas de extra incluidas u opcionales: el cliente marca o desmarca las opcionales al aceptar y la aceptación
--     guarda lo elegido y el importe firmado (decisión 1).
--   - Una versión nueva del inventario deja `superseded` los orçamentos enviados (decisión 2, en close_inventory_draft).
--   - Número por empresa (ORC-0001) compartido por las versiones del mismo envío (P7).
--   - Huella del documento: SHA-256 del `snapshot` congelado al enviar (P5). Es lo que firma el cliente.
--   - Caducidad sin tareas programadas: `valid_until` se compara al leer y al aceptar (P9). Por eso el estado no
--     guarda "caducado".
--   - Al aceptar: el envío pasa a `won` y se crea (o se actualiza, A12) el trabajo programado (decisión 5).
--   - Rechazar: el envío pasa a `lost` con el motivo. La empresa puede enviar otra versión, que lo vuelve a `quoted`.
--
-- Quién escribe: la empresa por save_quote_draft y send_quote (administradores, la empresa sale de la sesión); el
-- cliente por client_accept_quote y client_reject_quote, solo desde la Edge Function `client-order` (service_role).
-- Costes y márgenes son privados (RNF-03): las tablas solo las leen los administradores de la empresa y la Edge
-- Function no devuelve esas columnas al cliente.

create type public.quote_status as enum ('draft', 'sent', 'accepted', 'rejected', 'superseded');
create type public.quote_line_kind as enum ('base', 'extra', 'manual');
create type public.line_origin as enum ('calculated', 'manual');
create type public.job_status as enum ('scheduled', 'in_progress', 'delivered', 'closed', 'cancelled');

-- Número de orçamento por empresa (P7), como shipment_counters para el pedido.
create table public.quote_counters (
  company_id uuid primary key references public.companies (id) on delete cascade,
  last_number integer not null check (last_number >= 0)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  shipment_id uuid not null,
  -- Versión exacta del inventario con la que se calculó (RF-39). Del mismo pedido que el envío (A6, en las funciones).
  inventory_id uuid not null references public.inventories (id) on delete restrict,
  tariff_id uuid not null references public.tariffs (id) on delete restrict,
  number integer not null check (number > 0),
  version integer not null check (version >= 1),
  status public.quote_status not null default 'draft',
  -- Orçamento al que sustituye (la versión anterior enviada o aceptada).
  supersedes_id uuid references public.quotes (id) on delete restrict,
  pricing_mode public.quote_presentation not null,

  -- Resultado del cálculo (RF-30 a RF-35), con lo sugerido y lo final cuando la empresa lo ajusta (RF-37).
  volume_m3 numeric(7, 2) check (volume_m3 is null or volume_m3 >= 0),
  vehicle_count integer check (vehicle_count is null or vehicle_count >= 0),
  operator_count integer check (operator_count is null or operator_count >= 0),
  estimated_hours numeric(6, 2) check (estimated_hours is null or estimated_hours >= 0),
  km numeric(7, 1) check (km is null or km >= 0),
  -- Precio por hora del equipo, para presentar el orçamento por hora (pricing_mode = 'hourly').
  hourly_rate_cents bigint check (hourly_rate_cents is null or hourly_rate_cents >= 0),
  estimated_cost_cents bigint check (estimated_cost_cents is null or estimated_cost_cents >= 0),
  suggested_price_cents bigint check (suggested_price_cents is null or suggested_price_cents >= 0),
  -- Datos del cálculo para revisarlo después (valores sugeridos y ajustes manuales, RF-37).
  calculation jsonb not null default '{}'::jsonb,

  vat_pct numeric(4, 2) not null check (vat_pct between 0 and 30),
  valid_until date,
  conditions text check (conditions is null or length(conditions) <= 5000),

  -- Congelados al enviar: lo que ve y firma el cliente (RF-42, RF-43).
  snapshot jsonb,
  document_hash text check (document_hash is null or document_hash ~ '^[0-9a-f]{64}$'),
  sent_at timestamptz,
  rejected_at timestamptz,
  rejected_reason text check (rejected_reason is null or length(btrim(rejected_reason)) between 1 and 500),

  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (shipment_id, version),
  unique (company_id, number, version),
  unique (id, company_id),
  foreign key (shipment_id, company_id) references public.shipments (id, company_id) on delete restrict,
  -- Un orçamento enviado lleva lo que firma el cliente.
  check (status = 'draft' or (snapshot is not null and document_hash is not null and sent_at is not null and valid_until is not null)),
  check ((status = 'rejected') = (rejected_at is not null))
);

-- Un solo borrador por envío.
create unique index quotes_one_draft_per_shipment_idx on public.quotes (shipment_id) where status = 'draft';
create index quotes_company_id_status_idx on public.quotes (company_id, status);
create index quotes_inventory_id_idx on public.quotes (inventory_id);
create index quotes_tariff_id_idx on public.quotes (tariff_id);
create index quotes_supersedes_id_idx on public.quotes (supersedes_id);

create trigger quotes_set_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

create table public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null,
  company_id uuid not null,
  kind public.quote_line_kind not null,
  -- Servicio extra de la empresa. Descripción, cantidad y precio se copian: cambiar el servicio no cambia el orçamento.
  company_extra_id uuid,
  sort_order integer not null default 0,
  description text not null check (length(btrim(description)) between 1 and 200),
  quantity numeric(8, 2) not null check (quantity > 0),
  unit text check (unit is null or length(btrim(unit)) between 1 and 20),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  -- round(quantity × unit_price_cents), sin IVA. Lo calcula la base, nunca el navegador.
  total_cents bigint not null check (total_cents >= 0),
  -- Decisión 1: solo los extras pueden ser opcionales.
  optional boolean not null default false,
  origin public.line_origin not null default 'calculated',
  foreign key (quote_id, company_id) references public.quotes (id, company_id) on delete cascade,
  foreign key (company_extra_id, company_id) references public.company_extras (id, company_id) on delete restrict,
  check (not optional or kind = 'extra'),
  check (kind <> 'extra' or company_extra_id is not null)
);

create index quote_lines_quote_id_idx on public.quote_lines (quote_id);
create index quote_lines_company_extra_id_idx on public.quote_lines (company_extra_id);

-- Aceptación del cliente (RF-43). Inmutable: no hay función que la cambie.
create table public.acceptances (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null unique,
  company_id uuid not null,
  signer_name text not null check (length(btrim(signer_name)) between 1 and 200),
  -- Ruta de la firma en el bucket privado `signatures` (P6). La sube la Edge Function del cliente.
  signature_path text not null check (length(signature_path) between 1 and 300),
  ip inet,
  document_hash text not null check (document_hash ~ '^[0-9a-f]{64}$'),
  -- Líneas opcionales que eligió el cliente (decisión 1) e importes firmados.
  selected_line_ids uuid[] not null default '{}',
  signed_subtotal_cents bigint not null check (signed_subtotal_cents >= 0),
  signed_vat_cents bigint not null check (signed_vat_cents >= 0),
  signed_total_cents bigint not null check (signed_total_cents >= 0),
  accepted_at timestamptz not null default now(),
  foreign key (quote_id, company_id) references public.quotes (id, company_id) on delete restrict
);

create index acceptances_company_id_idx on public.acceptances (company_id);

-- El trabajo nace al aceptar (RF-46). Mínimo del paso 5: fecha, envío y orçamento. Equipo y vehículo, paso 6.
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  -- A6: un trabajo por envío.
  shipment_id uuid not null unique,
  -- A12: orçamento aceptado vigente. Si el cliente acepta uno nuevo antes de la mudanza, se actualiza y el cambio
  -- queda en el historial del envío.
  quote_id uuid not null,
  status public.job_status not null default 'scheduled',
  scheduled_start timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (shipment_id, company_id) references public.shipments (id, company_id) on delete restrict,
  foreign key (quote_id, company_id) references public.quotes (id, company_id) on delete restrict
);

create index jobs_company_id_start_idx on public.jobs (company_id, scheduled_start);
create index jobs_quote_id_idx on public.jobs (quote_id);

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

-- =====================================================================
-- RLS: solo lectura para los administradores de la empresa (RNF-01, RNF-03)
-- =====================================================================

alter table public.quote_counters enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_lines enable row level security;
alter table public.acceptances enable row level security;
alter table public.jobs enable row level security;

revoke all on public.quote_counters, public.quotes, public.quote_lines, public.acceptances, public.jobs from anon, authenticated;
grant select on public.quotes, public.quote_lines, public.acceptances, public.jobs to authenticated;

create policy "administrators read their company quotes"
on public.quotes for select to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

create policy "administrators read their company quote lines"
on public.quote_lines for select to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

create policy "administrators read their company acceptances"
on public.acceptances for select to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

create policy "administrators read their company jobs"
on public.jobs for select to authenticated
using (company_id = (select public.current_company_id()) and (select public.is_company_administrator()));

-- =====================================================================
-- quote_totals: subtotal, IVA y total de un orçamento (uso interno)
-- =====================================================================

-- p_selected: líneas opcionales elegidas. Nulo = ninguna (el precio "desde" que se muestra antes de elegir).
create or replace function public.quote_totals(p_quote_id uuid, p_selected uuid[])
returns table (subtotal_cents bigint, vat_cents bigint, total_cents bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with sub as (
    select coalesce(sum(l.total_cents), 0)::bigint as subtotal
    from public.quote_lines l
    where l.quote_id = p_quote_id and (not l.optional or l.id = any (coalesce(p_selected, '{}')))
  )
  select sub.subtotal,
         round(sub.subtotal * q.vat_pct / 100)::bigint,
         sub.subtotal + round(sub.subtotal * q.vat_pct / 100)::bigint
  from sub, public.quotes q
  where q.id = p_quote_id;
$$;

revoke all on function public.quote_totals(uuid, uuid[]) from public, anon, authenticated;

-- =====================================================================
-- save_quote_draft: crea o actualiza el borrador de la empresa (RF-35 a RF-37)
-- =====================================================================

-- Trabaja siempre sobre la versión vigente del inventario (A11) y la tarifa vigente de la empresa.
-- p_quote: { pricingMode, volumeM3, vehicleCount, operatorCount, estimatedHours, km, hourlyRateCents,
--            estimatedCostCents, suggestedPriceCents, calculation, validUntil (aaaa-mm-dd), conditions }
-- p_lines: [{ kind, companyExtraId, description, quantity, unit, unitPriceCents, optional, origin }]
--          Estado completo de las líneas del borrador: se sustituyen todas. El total de cada línea lo calcula la base.
-- Devuelve el id del borrador.
create or replace function public.save_quote_draft(p_order_id uuid, p_quote jsonb, p_lines jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_shipment record;
  v_inventory_id uuid;
  v_tariff_id uuid;
  v_quote_id uuid;
  v_number integer;
  v_version integer;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_quote is null or jsonb_typeof(p_quote) <> 'object' or p_lines is null or jsonb_typeof(p_lines) <> 'array' then
    raise exception 'invalid payload' using errcode = '22023';
  end if;

  -- El envío de esta empresa en el pedido, bloqueado: dos guardados a la vez no crean dos borradores.
  select s.id, s.status into v_shipment
  from public.shipments s
  where s.order_id = p_order_id and s.company_id = v_company_id
  for update;
  if v_shipment.id is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_shipment.status in ('cancelled', 'won') then
    raise exception 'shipment closed' using errcode = '23514';
  end if;

  -- Versión vigente del inventario: la última enviada (A11).
  select i.id into v_inventory_id
  from public.inventories i
  where i.order_id = p_order_id and i.submitted_at is not null
  order by i.version desc
  limit 1;
  if v_inventory_id is null then
    raise exception 'no inventory' using errcode = '23514';
  end if;

  select t.id into v_tariff_id from public.tariffs t where t.company_id = v_company_id order by t.version desc limit 1;
  if v_tariff_id is null then
    raise exception 'no tariff' using errcode = '23514';
  end if;

  select q.id into v_quote_id from public.quotes q where q.shipment_id = v_shipment.id and q.status = 'draft';

  if v_quote_id is null then
    -- Número del envío si ya tiene orçamentos (las versiones lo comparten); si no, el siguiente de la empresa.
    select q.number, max(q.version) + 1 into v_number, v_version
    from public.quotes q where q.shipment_id = v_shipment.id group by q.number;
    if v_number is null then
      insert into public.quote_counters (company_id, last_number)
      values (v_company_id, 1)
      on conflict (company_id) do update set last_number = public.quote_counters.last_number + 1
      returning last_number into v_number;
      v_version := 1;
    end if;

    insert into public.quotes (company_id, shipment_id, inventory_id, tariff_id, number, version, pricing_mode, vat_pct, created_by)
    select v_company_id, v_shipment.id, v_inventory_id, v_tariff_id, v_number, v_version, t.quote_presentation, t.vat_pct, v_user_id
    from public.tariffs t where t.id = v_tariff_id
    returning id into v_quote_id;
  end if;

  update public.quotes q
  set inventory_id = v_inventory_id,
      tariff_id = v_tariff_id,
      pricing_mode = coalesce((p_quote ->> 'pricingMode')::public.quote_presentation, q.pricing_mode),
      vat_pct = t.vat_pct,
      volume_m3 = (p_quote ->> 'volumeM3')::numeric,
      vehicle_count = (p_quote ->> 'vehicleCount')::integer,
      operator_count = (p_quote ->> 'operatorCount')::integer,
      estimated_hours = (p_quote ->> 'estimatedHours')::numeric,
      km = (p_quote ->> 'km')::numeric,
      hourly_rate_cents = (p_quote ->> 'hourlyRateCents')::bigint,
      estimated_cost_cents = (p_quote ->> 'estimatedCostCents')::bigint,
      suggested_price_cents = (p_quote ->> 'suggestedPriceCents')::bigint,
      calculation = coalesce(p_quote -> 'calculation', '{}'::jsonb),
      valid_until = (p_quote ->> 'validUntil')::date,
      conditions = nullif(btrim(coalesce(p_quote ->> 'conditions', '')), '')
  from public.tariffs t
  where q.id = v_quote_id and t.id = v_tariff_id;

  delete from public.quote_lines where quote_id = v_quote_id;

  insert into public.quote_lines (
    quote_id, company_id, kind, company_extra_id, sort_order, description, quantity, unit, unit_price_cents,
    total_cents, optional, origin
  )
  select v_quote_id, v_company_id,
         (e ->> 'kind')::public.quote_line_kind,
         nullif(e ->> 'companyExtraId', '')::uuid,
         (ordinality - 1)::integer,
         btrim(e ->> 'description'),
         (e ->> 'quantity')::numeric,
         nullif(btrim(coalesce(e ->> 'unit', '')), ''),
         (e ->> 'unitPriceCents')::bigint,
         round((e ->> 'quantity')::numeric * (e ->> 'unitPriceCents')::bigint)::bigint,
         coalesce((e ->> 'optional')::boolean, false),
         coalesce((e ->> 'origin')::public.line_origin, 'calculated')
  from jsonb_array_elements(p_lines) with ordinality as e;

  return v_quote_id;
end;
$$;

revoke all on function public.save_quote_draft(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_quote_draft(uuid, jsonb, jsonb) to authenticated;

-- =====================================================================
-- send_quote: congela el borrador y lo envía al cliente (RF-38 a RF-42)
-- =====================================================================

-- Construye el snapshot (lo que ve y firma el cliente, con el inventario anexo, RF-39), calcula su hash (P5), deja
-- `superseded` el orçamento enviado anterior y pasa el envío a `quoted`. Devuelve la versión enviada.
create or replace function public.send_quote(p_quote_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (select public.current_company_id());
  v_quote record;
  v_current_inventory uuid;
  v_actor_name text;
  v_totals record;
  v_snapshot jsonb;
  v_previous uuid;
begin
  if v_user_id is null or v_company_id is null or not (select public.is_company_administrator()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select q.*, s.order_id, s.status as shipment_status into v_quote
  from public.quotes q
  join public.shipments s on s.id = q.shipment_id
  where q.id = p_quote_id and q.company_id = v_company_id
  for update of q, s;
  if v_quote.id is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_quote.status <> 'draft' then
    raise exception 'quote not draft' using errcode = '23514';
  end if;
  if v_quote.shipment_status in ('cancelled', 'won') then
    raise exception 'shipment closed' using errcode = '23514';
  end if;
  if not exists (select 1 from public.quote_lines l where l.quote_id = p_quote_id) then
    raise exception 'empty quote' using errcode = '22023';
  end if;
  if v_quote.valid_until is null or v_quote.valid_until < (now() at time zone 'Europe/Lisbon')::date then
    raise exception 'invalid validity' using errcode = '22023';
  end if;

  -- El inventario pudo cambiar después de guardar el borrador: se envía solo sobre la versión vigente.
  select i.id into v_current_inventory
  from public.inventories i
  where i.order_id = v_quote.order_id and i.submitted_at is not null
  order by i.version desc limit 1;
  if v_current_inventory is distinct from v_quote.inventory_id then
    raise exception 'inventory changed' using errcode = '23514';
  end if;

  select * into v_totals from public.quote_totals(p_quote_id, null);

  v_snapshot := jsonb_build_object(
    'number', v_quote.number,
    'version', v_quote.version,
    'company', (select c.trade_name from public.companies c where c.id = v_company_id),
    'pricingMode', v_quote.pricing_mode,
    'hourlyRateCents', v_quote.hourly_rate_cents,
    'operatorCount', v_quote.operator_count,
    'vehicleCount', v_quote.vehicle_count,
    'estimatedHours', v_quote.estimated_hours,
    'volumeM3', v_quote.volume_m3,
    'km', v_quote.km,
    'vatPct', v_quote.vat_pct,
    'validUntil', v_quote.valid_until,
    'conditions', v_quote.conditions,
    'lines', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', l.id, 'kind', l.kind, 'description', l.description, 'quantity', l.quantity, 'unit', l.unit,
               'unitPriceCents', l.unit_price_cents, 'totalCents', l.total_cents, 'optional', l.optional
             ) order by l.sort_order), '[]'::jsonb)
      from public.quote_lines l where l.quote_id = p_quote_id
    ),
    'subtotalCents', v_totals.subtotal_cents,
    'vatCents', v_totals.vat_cents,
    'totalCents', v_totals.total_cents,
    'inventory', jsonb_build_object(
      'version', (select i.version from public.inventories i where i.id = v_quote.inventory_id),
      'lines', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'catalogItemId', l.catalog_item_id, 'description', l.description, 'room', l.room,
                 'quantity', l.quantity, 'unitVolumeM3', l.unit_volume_m3
               ) order by l.room, l.created_at), '[]'::jsonb)
        from public.inventory_lines l where l.inventory_id = v_quote.inventory_id
      )
    )
  );

  -- El orçamento enviado o aceptado anterior queda sustituido por este. Uno aceptado sigue vigente hasta que se
  -- acepte el nuevo (el trabajo no cambia por enviar), así que solo se sustituyen los enviados.
  select q.id into v_previous
  from public.quotes q
  where q.shipment_id = v_quote.shipment_id and q.id <> p_quote_id and q.status in ('sent', 'accepted', 'superseded', 'rejected')
  order by q.version desc limit 1;

  update public.quotes q
  set status = 'superseded'
  where q.shipment_id = v_quote.shipment_id and q.id <> p_quote_id and q.status = 'sent';

  update public.quotes
  set status = 'sent',
      supersedes_id = v_previous,
      snapshot = v_snapshot,
      document_hash = encode(extensions.digest(v_snapshot::text, 'sha256'), 'hex'),
      sent_at = now()
  where id = p_quote_id;

  update public.shipments set status = 'quoted', lost_reason = null
  where id = v_quote.shipment_id and status in ('inventory_received', 'quoted', 'lost');

  select name into v_actor_name from public.company_users where id = v_user_id;
  insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
  values (
    v_company_id, v_quote.shipment_id, 'quote_sent', 'company', v_user_id,
    jsonb_build_object('by', v_actor_name, 'version', v_quote.version, 'number', v_quote.number)
  );

  return v_quote.version;
end;
$$;

revoke all on function public.send_quote(uuid) from public, anon;
grant execute on function public.send_quote(uuid) to authenticated;

-- =====================================================================
-- client_accept_quote / client_reject_quote: el cliente desde su enlace (RF-43, RF-44, RF-46)
-- =====================================================================

-- Solo `service_role` (Edge Function `client-order`). El pedido sale del hash del enlace. La caducidad del enlace no
-- impide aceptar un orçamento vigente (docs/architecture-system.md); la del orçamento sí (RF-45).
-- p_document_hash: la huella del orçamento que vio el cliente; si la empresa envió otro entretanto, no coincide.
-- Devuelve el id del trabajo.
create or replace function public.client_accept_quote(
  p_token_hash text,
  p_quote_id uuid,
  p_document_hash text,
  p_selected_line_ids uuid[],
  p_signer_name text,
  p_signature_path text,
  p_ip inet
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid := public.lock_order_by_link(p_token_hash, false);
  v_quote record;
  v_totals record;
  v_selected uuid[];
  v_job_id uuid;
  v_previous_quote uuid;
begin
  select q.*, s.status as shipment_status, o.desired_date into v_quote
  from public.quotes q
  join public.shipments s on s.id = q.shipment_id
  join public.orders o on o.id = s.order_id
  where q.id = p_quote_id and s.order_id = v_order_id
  for update of q, s;
  if v_quote.id is null then
    raise exception 'quote not found' using errcode = '42501';
  end if;
  if v_quote.status <> 'sent' then
    raise exception 'quote not open' using errcode = '23514';
  end if;
  if v_quote.valid_until < (now() at time zone 'Europe/Lisbon')::date then
    raise exception 'quote expired' using errcode = '23514';
  end if;
  if p_document_hash is distinct from v_quote.document_hash then
    raise exception 'document changed' using errcode = '23514';
  end if;
  if v_quote.shipment_status = 'cancelled' then
    raise exception 'quote not open' using errcode = '23514';
  end if;

  -- Solo líneas opcionales de este orçamento; las que no lo son se ignoran.
  select coalesce(array_agg(l.id), '{}') into v_selected
  from public.quote_lines l
  where l.quote_id = p_quote_id and l.optional and l.id = any (coalesce(p_selected_line_ids, '{}'));

  select * into v_totals from public.quote_totals(p_quote_id, v_selected);

  insert into public.acceptances (
    quote_id, company_id, signer_name, signature_path, ip, document_hash, selected_line_ids,
    signed_subtotal_cents, signed_vat_cents, signed_total_cents
  ) values (
    p_quote_id, v_quote.company_id, btrim(p_signer_name), p_signature_path, p_ip, v_quote.document_hash, v_selected,
    v_totals.subtotal_cents, v_totals.vat_cents, v_totals.total_cents
  );

  update public.quotes set status = 'accepted' where id = p_quote_id;

  -- A12: si ya había trabajo (aceptó otro antes de la mudanza), pasa a este orçamento; si no, se crea con la fecha
  -- deseada del pedido a las 09:00 de Lisboa. La hora y el equipo los ajusta la empresa en la agenda (paso 6).
  select j.id, j.quote_id into v_job_id, v_previous_quote from public.jobs j where j.shipment_id = v_quote.shipment_id;
  if v_job_id is null then
    insert into public.jobs (company_id, shipment_id, quote_id, scheduled_start)
    values (
      v_quote.company_id, v_quote.shipment_id, p_quote_id,
      (v_quote.desired_date + time '09:00') at time zone 'Europe/Lisbon'
    )
    returning id into v_job_id;
  else
    update public.jobs set quote_id = p_quote_id where id = v_job_id;
    update public.quotes set status = 'superseded' where id = v_previous_quote and status = 'accepted';
  end if;

  update public.shipments set status = 'won', lost_reason = null where id = v_quote.shipment_id;

  insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
  values (
    v_quote.company_id, v_quote.shipment_id, 'won', 'client', null,
    jsonb_build_object(
      'by', btrim(p_signer_name), 'version', v_quote.version, 'number', v_quote.number,
      'totalCents', v_totals.total_cents, 'previousQuoteId', v_previous_quote
    )
  );

  return v_job_id;
end;
$$;

revoke all on function public.client_accept_quote(text, uuid, text, uuid[], text, text, inet) from public, anon, authenticated;
grant execute on function public.client_accept_quote(text, uuid, text, uuid[], text, text, inet) to service_role;

-- RF-44: el envío pasa a "perdido" con el motivo. La empresa puede enviar otra versión, que lo devuelve a `quoted`.
create or replace function public.client_reject_quote(p_token_hash text, p_quote_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid := public.lock_order_by_link(p_token_hash, false);
  v_quote record;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  select q.*, o.contact_name into v_quote
  from public.quotes q
  join public.shipments s on s.id = q.shipment_id
  join public.orders o on o.id = s.order_id
  where q.id = p_quote_id and s.order_id = v_order_id
  for update of q, s;
  if v_quote.id is null then
    raise exception 'quote not found' using errcode = '42501';
  end if;
  if v_quote.status <> 'sent' then
    raise exception 'quote not open' using errcode = '23514';
  end if;

  update public.quotes set status = 'rejected', rejected_at = now(), rejected_reason = left(v_reason, 500) where id = p_quote_id;
  update public.shipments set status = 'lost', lost_reason = left(v_reason, 500)
  where id = v_quote.shipment_id and status = 'quoted';

  insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
  values (
    v_quote.company_id, v_quote.shipment_id, 'lost', 'client', null,
    jsonb_build_object('by', v_quote.contact_name, 'version', v_quote.version, 'number', v_quote.number, 'reason', v_reason)
  );
end;
$$;

revoke all on function public.client_reject_quote(text, uuid, text) from public, anon, authenticated;
grant execute on function public.client_reject_quote(text, uuid, text) to service_role;

-- =====================================================================
-- close_inventory_draft: añade la decisión 2 (orçamentos enviados → superseded)
-- =====================================================================

-- Mismo cuerpo que en 20261119100000_client_link_writes, con la actualización de los orçamentos.
create or replace function public.close_inventory_draft(
  p_order_id uuid,
  p_actor_type text,
  p_actor_id uuid,
  p_actor_name text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inventory_id uuid;
  v_version integer;
  v_shipment record;
begin
  select i.id, i.version into v_inventory_id, v_version
  from public.inventories i
  where i.order_id = p_order_id and i.submitted_at is null;
  if v_inventory_id is null then
    raise exception 'no draft inventory' using errcode = '23514';
  end if;

  if not exists (select 1 from public.inventory_lines l where l.inventory_id = v_inventory_id) then
    raise exception 'empty inventory' using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.addresses a
    where a.order_id = p_order_id
      and not exists (
        select 1 from public.inventory_addresses ia
        where ia.inventory_id = v_inventory_id and ia.address_id = a.id
      )
  ) then
    raise exception 'missing address' using errcode = '22023';
  end if;

  -- Los cuidados se comparan como conjunto: el orden del array no cambia la base.
  if v_version > 1 then
    update public.inventory_lines l
    set base_changed = not exists (
      select 1
      from public.inventory_lines p
      where p.id = l.previous_line_id
        and p.catalog_item_id is not distinct from l.catalog_item_id
        and p.quantity = l.quantity
        and p.unit_volume_m3 is not distinct from l.unit_volume_m3
        and p.unit_weight_kg is not distinct from l.unit_weight_kg
        and p.unit_minutes = l.unit_minutes
        and p.handling_flags @> l.handling_flags
        and l.handling_flags @> p.handling_flags
    )
    where l.inventory_id = v_inventory_id;

    -- Las correcciones de cada empresa siguen a su línea en la versión nueva (RF-27). Se copian ahora y no al
    -- abrir el borrador para incluir las que se hicieron mientras estaba abierto. Si la base cambió, la línea
    -- lleva base_changed y la pantalla avisa de que la corrección puede no valer.
    insert into public.inventory_line_adjustments (
      inventory_line_id, order_id, company_id, unit_volume_m3, unit_weight_kg, unit_minutes, updated_by
    )
    select n.id, a.order_id, a.company_id, a.unit_volume_m3, a.unit_weight_kg, a.unit_minutes, a.updated_by
    from public.inventory_line_adjustments a
    join public.inventory_lines n on n.previous_line_id = a.inventory_line_id
    where n.inventory_id = v_inventory_id
    on conflict (inventory_line_id, company_id) do nothing;
  end if;

  update public.inventories set submitted_at = now() where id = v_inventory_id;

  -- Decisión 2 del paso 5: un orçamento enviado sobre la versión anterior queda desactualizado. El cliente ya no lo
  -- puede aceptar y la empresa ve el aviso para recalcular. Un orçamento aceptado no cambia (el trabajo sigue).
  update public.quotes q
  set status = 'superseded', updated_at = now()
  from public.shipments s
  where s.id = q.shipment_id and s.order_id = p_order_id and q.status = 'sent';

  update public.shipments
  set status = 'inventory_received'
  where order_id = p_order_id and status in ('new', 'awaiting_inventory', 'quoted');

  for v_shipment in
    select s.id, s.company_id
    from public.shipments s
    where s.order_id = p_order_id and s.status not in ('lost', 'cancelled')
  loop
    insert into public.shipment_events (company_id, shipment_id, kind, actor_type, actor_id, data)
    values (
      v_shipment.company_id, v_shipment.id, 'inventory_submitted', p_actor_type, p_actor_id,
      jsonb_build_object('by', p_actor_name, 'version', v_version)
    );
  end loop;

  return v_version;
end;
$$;

revoke all on function public.close_inventory_draft(uuid, text, uuid, text) from public, anon, authenticated;
