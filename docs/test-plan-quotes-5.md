# Mudaro · Plan de pruebas del paso 5 (orçamentos)

Fecha: 19/11/2026
Alcance: tarifa y servicios extra (migración `20261119200000`), orçamentos, aceptación, rechazo y trabajo (`20261119300000` y `20261119300100`), bucket de firmas (`20261119400000`), acciones `accept` y `reject` de la Edge Function `client-order`, y las pantallas de `apps/company` (Tarifas, editor, lista Orçamentos, detalle del pedido, Agenda) y de `apps/client` (orçamento del cliente).
Fuera de alcance: el motor de cálculo, que tiene sus tests unitarios (`pnpm test` en `packages/quotes`, 22 tests); asignar equipo y vehículo (paso 6); el límite de peticiones de `client-order` (pendiente antes de enlaces a clientes reales).
Fuentes: `docs/plan-paso-5-presupuestos.md`, `docs/quote-calculation.md` y `docs/test-plan-inventory-4b.md` (formato).

## Cómo usar este documento

- Cada caso tiene un **criterio de aceptación**: el caso pasa solo si se cumple tal cual está escrito.
- **Quién** indica quién ejecuta el caso: *Claude* (consultas SQL dentro de un bloque que termina con un error forzado, así Postgres deshace todo y no quedan datos) o *Persona*.
- **Estado** es `Pendiente`, `OK (fecha)` o `Fallo`.
- Un fallo se registra en la sección "Registro de fallos" del final.

## Preparación

| Elemento | Valor |
| --- | --- |
| Proyecto Supabase | `mudaro_app` (`hqatdrtcasoxlgucsjyh`), migraciones `20261119200000`, `20261119300000`, `20261119300100` y `20261119400000` aplicadas y registradas en el historial |
| Sesión simulada | `request.jwt.claims` con el id de un administrador activo y rol `authenticated`: "Mudanzas Peru" y, para el aislamiento, "Mudanzas Portugal". Las funciones `client_*` se llaman con el rol `service_role`, como la Edge Function |
| Datos de prueba | MD-0004 de "Mudanzas Peru" (`Cliente Teste`, inventario v3 enviado por la empresa, mudança el 15/12/2026) y su servicio extra "Embalagem de loiça". No uses datos reales |

**Ejecución de las secciones A a F (19/11/2026).** Un solo bloque SQL: genera el enlace, recorre todo el ciclo sobre MD-0004 y acaba con un error forzado. Comprobado después: MD-0004 sigue en "Inventário recebido", sin orçamentos, con el inventario v3 y la tarifa en la versión 2.

## A. Tarifa y servicios extra (RF-06, RF-07)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| A1 | Versión nueva | `save_tariff()` crea la versión siguiente (2 → 3) | Claude | OK (19/11/2026) |
| A2 | Otra empresa no lee la tarifa (RNF-01, RNF-03) | El administrador de otra empresa ve 0 tarifas de "Mudanzas Peru" | Claude | OK (19/11/2026) |
| A3 | Otra empresa no edita un servicio | `save_company_extra()` con el id de un servicio ajeno da `not allowed` | Claude | OK (19/11/2026) |

## B. Borrador y envío (RF-35 a RF-42)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| B1 | Un solo borrador | Guardar dos veces devuelve el mismo id; hay 1 borrador; versión 1 con el número siguiente de la empresa | Claude | OK (19/11/2026) |
| B2 | Total calculado por la base | Una línea de 2,5 × 12,34 € guarda 3085 céntimos, sea cual sea lo que mande el navegador | Claude | OK (19/11/2026) |
| B3 | Solo los extras son opcionales (decisión 1) | Una línea base marcada como opcional se rechaza (restricción `quote_lines_check`) | Claude | OK (19/11/2026) |
| B4 | Validez pasada (RF-45) | Enviar con la validez de ayer da `invalid validity` | Claude | OK (19/11/2026) |
| B5 | Sin líneas | Enviar un borrador vacío da `empty quote` | Claude | OK (19/11/2026) |
| B6 | Enviar | Estado `sent`; `document_hash` es el SHA-256 del `snapshot`; el envío pasa a `quoted`; hay un evento `quote_sent` con la versión | Claude | OK (19/11/2026) |
| B7 | Precios privados (RNF-03) | El `snapshot` (lo que ve el cliente) no lleva coste, precio sugerido ni el cálculo interno | Claude | OK (19/11/2026) |
| B8 | Enviado inmutable (RF-42) | Volver a enviar da `quote not draft` | Claude | OK (19/11/2026) |
| B9 | Versión nueva tras un rechazo | La v2 comparte número con la v1, `supersedes_id` apunta a la v1, el envío vuelve de `lost` a `quoted` sin motivo y la v1 sigue `rejected` | Claude | OK (19/11/2026) |

## C. Inventario nuevo (decisión 2)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| C1 | Sustituido | Al enviar una versión nueva del inventario, el orçamento enviado pasa a `superseded` | Claude | OK (19/11/2026) |
| C2 | Borrador desactualizado | Un borrador guardado sobre un inventario anterior no se envía: `inventory changed` | Claude | OK (19/11/2026) |
| C3 | Recalcular | Guardar otra vez el borrador lo pasa al inventario vigente y se envía | Claude | OK (19/11/2026) |

## D. Cliente: rechazar y aceptar por el enlace (RF-43, RF-44, RF-46)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| D1 | Permisos | `authenticated` no puede ejecutar `client_reject_quote` ni `client_accept_quote` (`permission denied`). Solo `service_role` | Claude | OK (19/11/2026) |
| D2 | Rechazar | El orçamento pasa a `rejected` con el motivo sin espacios sobrantes; el envío pasa a `lost` con el mismo motivo; evento `lost` con `actor_type = 'client'` y sin usuario | Claude | OK (19/11/2026) |
| D3 | Rechazar dos veces | Da `quote not open` | Claude | OK (19/11/2026) |
| D4 | Huella distinta | Aceptar con otra `document_hash` da `document changed` | Claude | OK (19/11/2026) |
| D5 | Orçamento caducado (RF-45) | Aceptar con la validez vencida da `quote expired` | Claude | OK (19/11/2026) |
| D6 | Aceptar con el enlace caducado | Se acepta (la caducidad del enlace no bloquea aceptar un orçamento vigente). Solo se guardan las líneas opcionales elegidas (se manda también una línea base y se ignora); los importes firmados son los de `quote_totals` (52,71 €); el nombre se guarda sin espacios sobrantes; orçamento `accepted` y envío `won` | Claude | OK (19/11/2026) |
| D7 | Trabajo (RF-46) | Se crea un trabajo `scheduled` del envío y del orçamento, el día de la mudança a las 09:00 de Lisboa; evento `won` del cliente | Claude | OK (19/11/2026) |
| D8 | Aceptar dos veces | Da `quote not open` | Claude | OK (19/11/2026) |
| D9 | Enlace desconocido | Da `link not found` | Claude | OK (19/11/2026) |
| D10 | Pedido ganado | La empresa ya no puede guardar un borrador: `shipment closed` | Claude | OK (19/11/2026) |
| D11 | Edge Function publicada | `reject` con un token de 64 caracteres que no existe: 404 `not_found`. Token mal formado: 400 `invalid_input`. `accept` con una firma que no es un PNG válido (o es JPEG): 400 `invalid_input` | Claude | OK (19/11/2026) |

## E. Seguridad

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| E1 | Otra empresa no lee (RNF-01) | El administrador de otra empresa ve 0 orçamentos, líneas, aceptaciones y trabajos | Claude | OK (19/11/2026) |
| E2 | Otra empresa no guarda | `save_quote_draft()` sobre un pedido ajeno da `not allowed` | Claude | OK (19/11/2026) |
| E3 | Otra empresa no envía | `send_quote()` de un orçamento ajeno da `not allowed` | Claude | OK (19/11/2026) |
| E4 | Sin escritura directa | `update` sobre `quotes` desde la sesión da `permission denied` | Claude | OK (19/11/2026) |
| E5 | Función interna | `quote_totals()` no se puede llamar desde la sesión | Claude | OK (19/11/2026) |
| E6 | Anónimo | `anon` no puede ejecutar `save_quote_draft` | Claude | OK (19/11/2026) |
| E7 | Funciones | Las 8 funciones del paso 5 son `security definer` con `search_path` vacío | Claude | OK (19/11/2026) |

## F. Firmas (P6)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| F1 | Bucket | `signatures` es privado, solo `image/png` y hasta 262 144 bytes | Claude | OK (19/11/2026) |
| F2 | La empresa lee las suyas | El administrador de "Mudanzas Peru" ve la firma de MD-0005 (1) | Claude | OK (19/11/2026) |
| F3 | Otra empresa no | El administrador de otra empresa ve 0 firmas | Claude | OK (19/11/2026) |

## G. Pantallas de la empresa (`apps/company`)

Con sesión de administrador de "Mudanzas Peru" en Chrome sobre `localhost:3001`.

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| G1 | Tarifas | "Guardar nova versão" crea la versión siguiente; un servicio extra se da de alta, se edita y se desactiva | Persona | Pendiente (la base, A1 a A3) |
| G2 | Editor: guardar | Abrir "Criar orçamento" de un pedido con inventario recibido: propone líneas base y los extras que pidió el cliente; "Guardar rascunho" dice "Rascunho guardado." y al recargar sigue igual | Claude (Chrome) | OK (19/11/2026, paso 5.4a) |
| G3 | Editor: enviar | "Enviar orçamento" pide confirmación; "Sim, enviar ao cliente" vuelve al pedido, que pasa a "Orçamentado" | Claude (Chrome) | OK (19/11/2026, con MD-0004) |
| G4 | Lista Orçamentos | Salen todas las versiones con su estado, total con IVA y margen; "Prontos para orçamentar" lista los pedidos con inventario sin orçamento enviado | Claude (Chrome) | OK (19/11/2026, paso 5.4b) |
| G5 | Rechazo visto por la empresa | Tras rechazar el cliente: el pedido está en "Perdido" y la pestaña Orçamentos muestra la versión "Recusado" con el motivo | Claude (Chrome) | OK (19/11/2026, con MD-0004) |
| G6 | Versión nueva | "Criar versão nova" y enviar: el pedido vuelve a "Orçamentado" y la pestaña lista v2 "Enviado" sobre v1 "Recusado" | Claude (Chrome) | OK (19/11/2026, con MD-0004) |
| G7 | Ganado | Con el orçamento aceptado: "Ganho", Resumo con "Trabalho agendado" (20/12/2026 às 09:00) y "Ver na agenda"; la lista lo pone en "Ganhos" y "Ver trabalho" abre el detalle | Claude (Chrome) | OK (19/11/2026, con MD-0005) |
| G8 | Agenda | El trabajo de MD-0005 sale el domingo 20/12 de 09:00 a 10:00 en la semana (sin recursos) y en la fila "Por atribuir" del día | Claude (Chrome) | OK (19/11/2026, con MD-0005) |

## H. Orçamento del cliente (`apps/client`)

En Chrome sobre `localhost:3003`, con el enlace del pedido. El navegador estaba en español, así que la página salió en español.

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| H1 | Ver | Con un orçamento enviado, el enlace muestra el orçamento (número, versión, validez, líneas, subtotal, IVA y total) en lugar del inventario, sin coste ni margen | Claude (Chrome) | OK (19/11/2026) |
| H2 | Opcionales | Marcar un extra opcional cambia el total al momento | Claude (Chrome) | OK (19/11/2026, paso 5.5) |
| H3 | Aceptar | Nombre y firma; "Aceptar y firmar" muestra "aceptado" con el total; la empresa ve "Ganho" y la firma está en el bucket | Claude (Chrome) | OK (19/11/2026, con MD-0005: 196,80 €) |
| H4 | Rechazar | "Rechazar presupuesto", motivo y "Rechazar": sale "Presupuesto rechazado" con el aviso de que una versión nueva aparecerá en el mismo enlace | Claude (Chrome) | OK (19/11/2026, con MD-0004) |
| H5 | Versión nueva en el mismo enlace | Tras enviar la empresa la v2, el mismo enlace muestra la v2 con "Aceptar y firmar" y "Rechazar presupuesto" | Claude (Chrome) | OK (19/11/2026, con MD-0004) |
| H6 | Imprimir | "Imprimir o guardar en PDF" abre el diálogo de impresión con la página sin botones | Persona | Pendiente |
| H7 | Caducado | Con la validez vencida, el orçamento sale como caducado y no deja aceptar | Persona | Pendiente (la base lo bloquea, D5) |

## Criterio de salida del paso 5

1. Todos los casos están en `OK`, salvo los de *Persona* (G1, H6, H7), que no bloquean.
2. Las secciones B7, D y E pasan sin excepción.
3. Quedan registradas las limitaciones conocidas, que no son fallos:
   - los km se escriben a mano (P2);
   - un trabajo nace sin equipo ni vehículo y a las 09:00 (paso 6);
   - `client-order` aún no limita la frecuencia de peticiones;
   - el plazo de conservación de las firmas sigue abierto.

## Registro de fallos

| Caso | Fecha | Qué se vio | Qué se esperaba | Estado |
| --- | --- | --- | --- | --- |
| G3 | 19/11/2026 | Un pedido cuyo inventario rellenó la empresa ("Eu, agora ou numa visita") no tiene panel del enlace en el detalle, y "Pedido criado" redirige al inventario: no hay forma de dar al cliente un enlace para ver y aceptar el orçamento. Para seguir la prueba, el enlace de MD-0004 se generó con `share_order_link` desde SQL | La empresa puede generar el enlace del cliente cuando envía un orçamento, sea quien sea quien rellenó el inventario | Corregido (19/11/2026), probado en Chrome (19/11/2026). MD-0004: "Gerar link novo" abre la pantalla de compartir en su versión de orçamento. MD-0003: la empresa rellena el inventario y envía ORC-0003 v1; el detalle muestra "Link do cliente · Sem link"; "Gerar link" genera el enlace con el mensaje del orçamento; el panel pasa a "Ativo"; el enlace abre el orçamento en `apps/client` |
| G5 | 19/11/2026 | Con el pedido en "Perdido", el panel "Link do cliente" dice "Fechado · O pedido está fechado: o link já não dá acesso." Pero el enlace sigue abriendo y el cliente verá ahí la versión nueva | El panel trata "Perdido" como abierto (`linkState` en `orders/domain/detail.ts`) | Abierto |
| G6 | 19/11/2026 | El panel del enlace dice "Cliente pode alterar o inventário até aceitar um orçamento." Ya estaba anotado en `docs/plan-modelo-bd.md`: con un orçamento enviado el cliente no edita el inventario desde el enlace | Un texto que describa lo que el cliente puede hacer | Abierto (ya anotado) |
| H1 | 19/11/2026 | La pestaña del navegador del cliente se llama "Inventario de tu mudanza" también cuando muestra el orçamento | "Presupuesto de tu mudanza" (o equivalente) cuando hay orçamento | Abierto, menor |
| H2 | 19/11/2026 | Con el inventario rellenado por la empresa (MD-0003), el orçamento en el enlace dice "preparó este presupuesto con el inventario que enviaste", pero el cliente no envió nada | Un texto que no dé por hecho que el cliente envió el inventario | Abierto, menor |
| G5 | 19/11/2026 | El percurso del pedido no marca "Perdido" (sigue "5 · Ganho · Por fazer") y "Link partilhado" sale después de "Inventário recebido" con una hora posterior, porque el enlace se generó tarde | El percurso refleja la pérdida | Abierto, menor |
| G3 | 19/11/2026 | Con el inventario rellenado por la empresa, el percurso tenía el paso "Link partilhado" y lo marcaba como hecho aunque el enlace no se hubiera generado. (MD-0001 no sirve de ejemplo: es un dato de prueba cargado por SQL, con inventario del cliente y sin enlace, una combinación que la app no produce) | Sin inventario por enlace, el percurso no tiene ese paso | Corregido y probado en Chrome (19/11/2026, MD-0004: Pedido criado, Inventário recebido, Orçamento enviado, Ganho) |
