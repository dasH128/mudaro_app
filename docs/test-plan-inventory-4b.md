# Mudaro · Plan de pruebas del paso 4b (inventario y enlace)

Fecha: 18/11/2026
Alcance: tablas, restricciones, RLS y funciones del inventario con líneas, las correcciones de cada empresa y el enlace del cliente (migraciones `20261118200000` a `20261118200300`).
Fuera de alcance: la conexión con `apps/company` (se probará en su propio bloque), la Edge Function que valida el enlace (B9), las fotos (bucket de Storage) y los presupuestos (paso 5).
Fuentes: `docs/plan-modelo-bd.md` ("Inventario por capas y enlace"), `docs/diagram/mudaro-model.dbml` y `docs/test-plan-orders-4a.md` (formato).

## Cómo usar este documento

- Cada caso tiene un **criterio de aceptación**: el caso pasa solo si se cumple tal cual está escrito.
- **Quién** indica quién ejecuta el caso: *Claude* (consultas SQL dentro de un bloque que termina con un error forzado, así Postgres deshace todo y no quedan datos) o *Persona*.
- **Estado** es `Pendiente`, `OK (fecha)` o `Fallo`.
- Un fallo se registra en la sección "Registro de fallos" del final.

## Preparación

| Elemento | Valor |
| --- | --- |
| Proyecto Supabase | `mudaro_app` (`hqatdrtcasoxlgucsjyh`), migraciones `20261118200000`, `20261118200100` y `20261118200200` aplicadas y registradas en el historial |
| Sesión simulada | `request.jwt.claims` con el id de un administrador activo y rol `authenticated`. Dos administradores de empresas distintas para las pruebas de aislamiento |
| Datos de prueba | Pedido creado con `create_order()` dentro de la misma prueba: `Cliente Teste`, `+351900000001`, `Rua Teste 1, Lisboa` a `Rua Teste 2, Cascais`. No uses datos reales |

## A. Enlace del cliente

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| A1 | Generar el enlace (RF-15, RNF-02) | `share_order_link()` devuelve un token de 64 caracteres; `orders.token_hash` es su SHA-256 en hexadecimal; caduca a 7 días si el pedido no tenía validez; el envío pasa a `awaiting_inventory`; hay un evento `link_shared` | Claude | OK (18/11/2026) |
| A2 | Reenviar el enlace | El token nuevo es distinto; el hash del token anterior ya no coincide con el guardado; hay un evento `link_resent` | Claude | OK (18/11/2026) |
| A3 | Días de validez en el evento | El evento `link_shared` lleva `linkValidityDays` (lo lee el historial de la app) | Claude | Pendiente: requiere aplicar `20261118200300` |

## B. Borrador e inventario

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| B1 | Línea del catálogo (RF-20, RF-39) | El volumen guardado es el del catálogo aunque se envíe otro valor | Claude | OK (18/11/2026) |
| B2 | Objeto libre sin medidas (RF-21, RF-36) | La línea queda con `needs_review = true` | Claude | OK (18/11/2026) |
| B3 | Objeto libre sin descripción | Rechazado con `missing description` | Claude | OK (18/11/2026) |
| B4 | Marcar un extra (RF-24) | `set_inventory_extra()` crea la fila en `inventory_extras` | Claude | OK (18/11/2026) |
| B5 | Enviar la versión 1 (RF-26) | `submit_inventory()` devuelve 1, el envío pasa a `inventory_received` y hay un evento `inventory_submitted` | Claude | OK (18/11/2026) |
| B6 | Versión enviada inmutable (A10) | Tras enviar, editar da `no draft inventory` y borrar una línea enviada da `a submitted inventory version cannot change` | Claude | OK (18/11/2026) |

## C. Versiones y correcciones

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| C1 | Corregir el borrador | `set_line_adjustment()` sobre una línea del borrador se rechaza (`only the current version can be adjusted`) | Claude | OK (18/11/2026) |
| C2 | Abrir versión nueva (RF-27) | `open_inventory_draft()` devuelve el mismo id si se llama dos veces; copia las 2 líneas con `previous_line_id`, el extra y las 2 direcciones | Claude | OK (18/11/2026) |
| C3 | Base cambiada (RF-27) | Al enviar la versión 2: la línea con la cantidad cambiada y la línea nueva tienen `base_changed = true`; la línea sin cambios, `false` | Claude | OK (18/11/2026) |
| C4 | Corrección hecha con el borrador abierto | Una corrección sobre la versión 1 hecha después de abrir el borrador aparece en la línea equivalente de la versión 2 al enviarla | Claude | OK (18/11/2026) |
| C5 | Versión antigua | Corregir una línea de la versión 1 cuando la vigente es la 2 se rechaza | Claude | OK (18/11/2026) |

## D. Seguridad

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| D1 | Otra empresa no lee (RNF-01) | El administrador de otra empresa ve 0 líneas y 0 correcciones del pedido | Claude | OK (18/11/2026) |
| D2 | Otra empresa no escribe | `save_inventory_line()`, `share_order_link()` y `set_line_adjustment()` dan `not allowed` | Claude | OK (18/11/2026) |
| D3 | Función interna | `lock_owned_order()` no se puede llamar desde la sesión (`permission denied`) | Claude | OK (18/11/2026) |
| D4 | Pedido cancelado | Tras `cancel_order()`, `open_inventory_draft()` da `order cancelled` | Claude | OK (18/11/2026) |
| D5 | Permisos | Las 8 funciones públicas son `security definer` con `search_path` vacío; `authenticated` las ejecuta y `anon` no | Claude | OK (18/11/2026) |
| D6 | Sin restos | Tras las pruebas, 0 líneas, 0 correcciones y 0 pedidos de prueba en la base de datos | Claude | OK (18/11/2026) |

## Criterio de salida del paso 4b (base de datos)

1. Todos los casos están en `OK`.
2. Los casos de seguridad (sección D) pasan sin excepción.
3. Quedan registradas las limitaciones conocidas, que no son fallos:
   - la obligatoriedad de los accesos (RF-23) la valida la app, porque la base tiene valores por defecto;
   - una línea borrada entre versiones no deja marca;
   - el cliente aún no puede usar el enlace (Edge Function pendiente de B9);
   - las fotos no se guardan (sin bucket de Storage);
   - los presupuestos no pasan a `superseded` al enviar una versión nueva (paso 5).

## Registro de fallos

| Caso | Fecha | Qué se vio | Qué se esperaba | Estado |
| --- | --- | --- | --- | --- |
| C4 | 18/11/2026 | En revisión, antes de aplicar: las correcciones se copiaban al abrir el borrador, así que una corrección hecha después se perdía en la versión nueva | La corrección pasa a la versión nueva | Corregido antes de aplicar (se copian al enviar). Probado en C4 |
| A3 | 18/11/2026 | En revisión: el evento del enlace guardaba `expiresAt` y la app lee `linkValidityDays`; el historial habría mostrado 0 días | El evento lleva los días de validez | Corregido en `20261118200300`, pendiente de aplicar |
