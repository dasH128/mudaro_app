# Mudaro · Plan de pruebas de RF-69 (cancelar un pedido)

Fecha: 21/11/2026
Alcance: migración `20261121100000_cancel_order_jobs.sql` (nueva versión de `cancel_order()`), el menú "Mais ações" del detalle con "Cancelar pedido", el aviso de pedido cancelado y el filtro "Cancelados" de la lista en `apps/company`.
Fuera de alcance: lo que ve el cliente al abrir el enlace de un pedido cancelado (sigue siendo "enlace no encontrado"; se revisa con el límite de peticiones de `client-order`) y el aviso a otras empresas con envío vivo (fase 3).
Fuentes: `docs/requirement-mvp.md` (RF-69), `docs/plan-modelo-bd.md` (decisión de cancelación) y `docs/test-plan-jobs-6.md` (formato).

## Cómo usar este documento

- Cada caso tiene un **criterio de aceptación**: el caso pasa solo si se cumple tal cual está escrito.
- **Quién** indica quién ejecuta el caso: *Claude* (en Chrome) o *Persona* (SQL en el editor de Supabase).
- **Estado** es `Pendiente`, `OK (fecha)` o `Fallo`.
- Un fallo se registra en la sección "Registro de fallos" del final.

## Preparación

| Elemento | Valor |
| --- | --- |
| Proyecto Supabase | `mudaro_app` (`hqatdrtcasoxlgucsjyh`), con `20261121100000_cancel_order_jobs.sql` aplicada a mano por la persona y registrada en el historial el 21/11/2026 |
| Datos de prueba | MD-0007 (`Cliente Teste RF-69`), creado por la persona el 21/11/2026 y **cancelado** en B3 con el motivo "Teste RF-69: o cliente desistiu". MD-0005 (`Cliente Teste`, trabajo **programado**) y MD-0006 (`Cliente Teste 2 (pruebas 6.9)`, trabajo **cerrado**) de "Mudanzas Peru". El bloque SQL crea además su propio pedido y lo deshace al final |
| Pantallas | `pnpm dev --filter=company` en http://localhost:3001 con una cuenta de administrador de "Mudanzas Peru" |

## A. Base de datos (`cancel_order`)

Se ejecutan todos con el bloque SQL del final. Acaba con `raise exception`, así que no deja datos: el mensaje del error lista el resultado de cada caso.

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| A1 | Cancelar un pedido nuevo | El envío pasa a `cancelled`, el pedido guarda fecha, motivo y `cancelled_by_type = 'company'`, y quedan el evento `cancelled` en el envío y `order_cancelled` en `audit_log` | Persona | OK (21/11/2026) |
| A2 | Motivo vacío | Un motivo de solo espacios da `22023` y no cambia nada | Persona | OK (21/11/2026) |
| A3 | Otra empresa (RNF-01) | El administrador de la segunda empresa de pruebas recibe `42501`, igual que con un pedido inexistente | Persona | OK (21/11/2026) |
| A4 | Cancelar dos veces | La segunda llamada da `23514` (`order already cancelled`) | Persona | OK (21/11/2026) |
| A5 | Trabajo programado | Cancelar MD-0005 cancela también su trabajo (`cancelled`, con motivo), borra sus asignaciones y deja el evento `job_cancelled` | Persona | OK (21/11/2026) |
| A6 | Trabajo cerrado | Cancelar MD-0006 da `55000` con el mensaje `job started` y no cambia nada | Persona | OK (21/11/2026) |
| A7 | Pedido perdido | Con el envío en `lost`, cancelar da `55000` con `order not open` | Persona | OK (21/11/2026) |

## B. Pantallas

Se ejecutan después de aplicar la migración. B3 y B4 cancelan de verdad un pedido: hay que usar uno creado para la prueba, nunca MD-0005 ni MD-0006.

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| B1 | Menú en pedidos vivos | En un pedido nuevo, "Mais ações" se abre con "Cancelar pedido" en rojo; Escape y un clic fuera lo cierran | Claude | OK (21/11/2026) |
| B2 | Motivo obligatorio | Enviar sin motivo no envía el formulario (campo obligatorio); con solo espacios, el servidor responde "Indica o motivo." | Claude | OK (21/11/2026) |
| B3 | Cancelar | Con motivo, el detalle se refresca: etiqueta "Cancelado", aviso con fecha, quién y motivo, percurso acabado en "Cancelado", sin panel del enlace, sin "Editar inventário" ni "Nova versão", y el evento en Histórico | Claude | OK (21/11/2026) |
| B4 | Lista | El pedido cancelado no sale en "Todos" ni cuenta en su número; sale en el filtro "Cancelados" con "Cancelado a dd/mm/aaaa. Motivo: …" y no aparece en "Próximas mudanças" | Claude | OK (21/11/2026) |
| B5 | Trabajo empezado o terminado | En MD-0006 (cerrado), "Mais ações" explica que la mudança ya empezó o terminó y no ofrece cancelar | Claude | OK (21/11/2026) |
| B6 | Pantallas que escriben | `/orders/<id>/inventory` y `/orders/<id>/created` de un pedido cancelado dan "no encontrado" | Claude | OK (21/11/2026) |
| B7 | Orçamentos | Los orçamentos de un pedido cancelado no salen en la lista de Orçamentos | Claude | Pendiente: MD-0007 no tenía orçamentos; probar al cancelar un pedido con orçamento enviado |

## Bloque SQL (casos A1 a A7)

Pegar en el editor SQL de Supabase. Busca el administrador de "Mudanzas Peru" y el de otra empresa por su rol; si los nombres cambian, ajustar el `where`.

```sql
do $$
declare
  v_admin uuid;
  v_company uuid;
  v_other uuid;
  v_number integer;
  v_order uuid;
  v_job uuid;
  v_result text := '';
begin
  select cu.id, cu.company_id into v_admin, v_company
  from public.company_users cu
  join public.companies c on c.id = cu.company_id
  where c.trade_name = 'Mudanzas Peru' and cu.role = 'administrator' and cu.active
  limit 1;
  select cu.id into v_other
  from public.company_users cu
  where cu.company_id <> v_company and cu.role = 'administrator' and cu.active
  limit 1;

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);

  -- Pedido propio de la prueba, con el inventario de la empresa (sin enlace)
  v_number := public.create_order(
    null, 'Cliente Teste RF-69', '+351912000069', 'private', '', '', 'Rua A, Lisboa', 'Rua B, Porto', '{}'::text[],
    current_date + 30, 'exact', '', 'company', null
  );
  select order_id into v_order from public.shipments where company_id = v_company and number = v_number;

  -- A2: motivo vacío
  begin
    perform public.cancel_order(v_order, '   ');
    v_result := v_result || 'A2 FALLO (aceptó el motivo vacío); ';
  exception when sqlstate '22023' then
    v_result := v_result || 'A2 OK; ';
  end;

  -- A3: otra empresa
  if v_other is null then
    v_result := v_result || 'A3 sin probar (no hay otra empresa); ';
  else
    perform set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
    begin
      perform public.cancel_order(v_order, 'Teste A3');
      v_result := v_result || 'A3 FALLO (canceló un pedido ajeno); ';
    exception when sqlstate '42501' then
      v_result := v_result || 'A3 OK; ';
    end;
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  end if;

  -- A1: cancelar
  perform public.cancel_order(v_order, 'O cliente desistiu');
  if (select status from public.shipments where order_id = v_order) = 'cancelled'
    and (select cancellation_reason = 'O cliente desistiu' and cancelled_by_type = 'company' and cancelled_at is not null
         from public.orders where id = v_order)
    and exists (select 1 from public.shipment_events e join public.shipments s on s.id = e.shipment_id
                where s.order_id = v_order and e.kind = 'cancelled')
    and exists (select 1 from public.audit_log where action = 'order_cancelled' and entity_id = v_order::text)
  then
    v_result := v_result || 'A1 OK; ';
  else
    v_result := v_result || 'A1 FALLO; ';
  end if;

  -- A4: cancelar dos veces
  begin
    perform public.cancel_order(v_order, 'Outra vez');
    v_result := v_result || 'A4 FALLO (canceló dos veces); ';
  exception when sqlstate '23514' then
    v_result := v_result || 'A4 OK; ';
  end;

  -- A5: MD-0005, trabajo programado
  select s.order_id, j.id into v_order, v_job
  from public.shipments s join public.jobs j on j.shipment_id = s.id
  where s.company_id = v_company and s.number = 5 and j.status = 'scheduled';
  if v_job is null then
    v_result := v_result || 'A5 sin probar (MD-0005 no tiene el trabajo programado); ';
  else
    perform public.cancel_order(v_order, 'Teste A5');
    if (select status = 'cancelled' and cancel_reason = 'Teste A5' from public.jobs where id = v_job)
      and not exists (select 1 from public.assignments where job_id = v_job)
      and exists (select 1 from public.shipment_events e join public.jobs j on j.shipment_id = e.shipment_id
                  where j.id = v_job and e.kind = 'job_cancelled' and e.data ->> 'reason' = 'Teste A5')
    then
      v_result := v_result || 'A5 OK; ';
    else
      v_result := v_result || 'A5 FALLO; ';
    end if;
  end if;

  -- A6: MD-0006, trabajo cerrado
  v_order := null;
  select s.order_id into v_order from public.shipments s where s.company_id = v_company and s.number = 6;
  begin
    perform public.cancel_order(v_order, 'Teste A6');
    v_result := v_result || 'A6 FALLO (canceló con el trabajo cerrado); ';
  exception when sqlstate '55000' then
    v_result := v_result || case when sqlerrm = 'job started' then 'A6 OK; ' else 'A6 FALLO (' || sqlerrm || '); ' end;
  end;

  -- A7: pedido perdido (se marca a mano: la prueba corre como propietaria de la base)
  v_number := public.create_order(
    null, 'Cliente Teste RF-69 perdido', '+351912000070', 'private', '', '', 'Rua A, Lisboa', 'Rua B, Porto', '{}'::text[],
    current_date + 30, 'exact', '', 'company', null
  );
  select order_id into v_order from public.shipments where company_id = v_company and number = v_number;
  begin
    update public.shipments set status = 'lost', lost_reason = 'Teste A7' where order_id = v_order;
    begin
      perform public.cancel_order(v_order, 'Teste A7');
      v_result := v_result || 'A7 FALLO (canceló un pedido perdido); ';
    exception when sqlstate '55000' then
      v_result := v_result || case when sqlerrm = 'order not open' then 'A7 OK; ' else 'A7 FALLO (' || sqlerrm || '); ' end;
    end;
  exception when others then
    v_result := v_result || 'A7 sin probar (no se pudo marcar como perdido: ' || sqlerrm || '); ';
  end;

  raise exception 'Fin de las pruebas, todo se deshace. Resultados: %', v_result;
end;
$$;
```

## Registro de fallos

| Fecha | Caso | Qué pasó | Arreglo |
| --- | --- | --- | --- |
