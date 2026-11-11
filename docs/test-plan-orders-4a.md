# Mudaro · Plan de pruebas del paso 4a (pedidos y envíos)

Fecha: 10/11/2026
Alcance: tablas, restricciones, RLS y funciones de pedidos (migraciones `20261109100000` a `20261109100200`) y su conexión con `apps/company` (lista, alta, "Pedido criado" y detalle).
Fuera de alcance: inventario con líneas, enlace con token y extras (paso 4b), presupuestos (paso 5) y la pantalla de cancelar (RF-69, la función `cancel_order()` sí se prueba).
Fuentes: `docs/plan-modelo-bd.md` (decisiones del paso 4), `docs/diagram/mudaro-model.dbml` y `apps/company/CLAUDE.md`.

## Cómo usar este documento

- Cada caso tiene un **criterio de aceptación**: el caso pasa solo si se cumple tal cual está escrito.
- **Quién** indica quién ejecuta el caso: *Claude* (consultas SQL, siempre dentro de una transacción con `rollback`, sin dejar datos) o *Persona* (usa la app con sesión de administrador).
- **Estado** es `Pendiente`, `OK (fecha)` o `Fallo`. Un `OK` con fecha significa que ya se ejecutó y cumplió el criterio.
- Un fallo se registra en la sección "Registro de fallos" del final.

## Preparación

| Elemento | Valor |
| --- | --- |
| Proyecto Supabase | `mudaro_app` (`hqatdrtcasoxlgucsjyh`), migraciones `20261109100000`, `20261109100100` y `20261109100200` aplicadas |
| App | `pnpm dev --filter=company`, sesión iniciada como administrador de una empresa activa |
| Estado de partida | 0 pedidos. El primer pedido creado debe numerarse `MD-0001` |
| Datos de prueba | Cliente `Cliente Teste`, teléfono `+351900000001`. Origen `Rua Teste 1, Lisboa`, destino `Rua Teste 2, Cascais`, fecha futura. No uses datos reales |

**Limpieza.** Los pedidos creados desde la app no se pueden borrar desde la app: el historial de envíos es inmutable por diseño (`shipment_events`). Al terminar, la limpieza se hace con SQL desactivando un momento los triggers de inmutabilidad, y solo con confirmación expresa de quien lleva el proyecto. Los casos de la sección A no dejan datos.

## A. Base de datos

| ID | Prueba | Procedimiento | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- | --- |
| A1 | Numeración sin saltos (RF-17) | Con sesión de administrador, crear dos pedidos seguidos con `create_order()` | Los números devueltos son consecutivos (`n` y `n+1`) | Claude | OK (10/11/2026) |
| A2 | Reutilizar la ficha del cliente (RF-14) | Crear dos pedidos con el mismo teléfono y distinto nombre | `clients` tiene una sola fila con ese teléfono y los dos envíos apuntan a ella | Claude | OK (10/11/2026) |
| A3 | Paradas en blanco | Crear un pedido con paradas `['Paragem 1', '  ']` | Se guarda una parada, con su hueco en `addresses` y su texto en `inventory_addresses`; el pedido tiene 3 direcciones en total (origen, parada, destino) | Claude | OK (10/11/2026) |
| A4 | Máximo de paradas | Crear un pedido con 4 paradas | La función falla con el código `22023` y no se crea ninguna fila | Claude | OK (10/11/2026) |
| A5 | Datos obligatorios | Crear pedidos con teléfono sin `+351` o con 8 dígitos, con el origen vacío, con el destino vacío y sin fecha | Cada caso falla con el código `22023` y no se crea ninguna fila | Claude | OK (10/11/2026) |
| A6 | Lectura de la propia empresa (RNF-01) | Como administrador, leer `clients`, `orders`, `shipments`, `addresses`, `inventories` e `inventory_addresses` | Devuelven las filas de los pedidos creados en el caso A1 | Claude | OK (10/11/2026) |
| A7 | Escritura directa bloqueada | Como usuario autenticado, hacer `update` sobre `shipments` y `select` sobre `shipment_counters` | Ambos fallan con `insufficient_privilege` | Claude | OK (10/11/2026) |
| A8 | Sin acceso anónimo | Como `anon`, leer `orders` | Falla con `insufficient_privilege` | Claude | OK (10/11/2026) |
| A9 | Aislamiento entre empresas (RNF-01) | Crear dentro de la prueba una empresa B con un administrador y leer, como B, todas las tablas de pedidos que contienen datos de A | 0 filas en cada tabla | Claude | OK (10/11/2026) |
| A10 | Cancelar un pedido ajeno | Como administrador de B, llamar a `cancel_order()` con un pedido de A | Falla con `42501`; el pedido de A sigue sin cancelar | Claude | OK (10/11/2026) |
| A11 | Cliente de otra empresa | Como administrador de B, llamar a `create_order()` con el `p_client_id` de una ficha de A | Falla con el error `client not found` y no se crea ninguna fila | Claude | OK (10/11/2026) |
| A12 | Rol operario | Como usuario con rol `operator`, llamar a `create_order()` y leer `shipments` | La función falla con `42501` y la lectura devuelve 0 filas | Claude | OK (10/11/2026) |
| A13 | Coherencia envío y cliente | Como propietario, insertar un `shipments` cuyo `client_id` pertenece a otra empresa | Falla por la clave compuesta (`foreign_key_violation`) | Claude | OK (10/11/2026) |
| A14 | Cancelar el propio pedido (RF-69) | Cancelar un pedido con motivo `"  cliente desistiu "` | `orders.cancelled_at` y `cancelled_by_id` rellenos, motivo guardado sin espacios, envío en `cancelled`, un evento `cancelled` y una fila `order_cancelled` en `audit_log` | Claude | OK (10/11/2026) |
| A15 | Cancelación repetida o inexistente | Cancelar dos veces el mismo pedido y cancelar un id que no existe | La segunda falla con `23514`; el id inexistente falla con `42501` | Claude | OK (10/11/2026) |
| A16 | Envío cancelado no se reactiva | Cambiar el estado de un envío `cancelled` a `new` | Falla con `23514` | Claude | OK (10/11/2026) |
| A17 | Historial inmutable | Hacer `update` y `delete` sobre `shipment_events` | Ambos fallan con el mensaje `shipment_events is immutable` | Claude | OK (10/11/2026) |
| A18 | Versión enviada inmutable | Marcar una versión como enviada y modificar sus direcciones | La modificación falla con `23514` | Claude | OK (10/11/2026) |
| A19 | Un solo borrador por pedido | Con una versión enviada, abrir un borrador (versión 2) y luego intentar abrir otro | El primero se crea; el segundo falla con `unique_violation` | Claude | OK (10/11/2026) |
| A20 | Numeración con concurrencia (opcional) | Lanzar dos `create_order()` a la vez para la misma empresa | Números distintos y sin huecos; ninguna falla por duplicado | Claude | Pendiente |

## B. Aplicación

Prerrequisito: sesión iniciada como administrador y los datos de prueba de la sección "Preparación".

| ID | Prueba | Pasos | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- | --- |
| B1 | Lista sin pedidos | Abrir `/pt/orders` con 0 pedidos | La página carga sin error ni pantalla en blanco | Persona | OK (11/11/2026) |
| B2 | Alta con enlace (RF-13, RF-15) | En "Novo pedido", rellenar los datos de prueba, elegir "el cliente rellena por enlace" y una validez de 14 días, y enviar | Redirige a `/pt/orders/MD-0001/created`; el título muestra `MD-0001`, y la ruta (origen, destino) y la fecha coinciden con lo escrito | Persona | OK (11/11/2026) |
| B3 | Alta con inventario por la empresa (RF-19) | Crear otro pedido eligiendo "lo relleno yo" | Redirige a `/pt/orders/MD-0002/inventory` y la pantalla del inventario carga con los datos del pedido | Persona | Pendiente |
| B4 | Sugerir cliente existente (RF-14) | En "Novo pedido", escribir el teléfono `+351900000001` | Aparece la sugerencia con el nombre del cliente ya creado ("Este número já é cliente: Cliente Teste"). Con solo pedidos en "Nova" muestra "Sem pedidos anteriores": el contador "N pedidos anteriores" solo cuenta con un pedido ganado y se comprueba en el paso 5 | Persona | OK (11/11/2026) |
| B5 | Validaciones de formulario | Intentar enviar con teléfono inválido, con fecha pasada y sin origen. Después añadir paradas hasta llegar a 3 (origen y destino no cuentan) | Cada error aparece junto a su campo, el formulario conserva lo escrito y no se crea ningún pedido. Con 3 paradas el botón de añadir desaparece, así que no se puede añadir una cuarta (el rechazo de 4 paradas en servidor se prueba en A4) | Persona | OK (11/11/2026) |
| B6 | Paradas intermedias | Crear un pedido con 2 paradas | "Pedido criado" y el detalle muestran las paradas en el orden escrito | Persona | Fallo (11/11/2026), corregido: repetir |
| B7 | Lista con datos | Abrir `/pt/orders` tras crear los pedidos | Aparecen todos los pedidos creados, con su número, cliente, ruta, fecha, etapa "Nova" y la nota de recién creado | Persona | Pendiente |
| B8 | Filtros y búsqueda (RF-17) | Filtrar por etapa "Nova" y buscar por nombre y por `MD-0001` | Cada filtro devuelve solo los pedidos esperados; la búsqueda por número encuentra exactamente ese pedido | Persona | Pendiente |
| B9 | Detalle del pedido | Abrir `/pt/orders/MD-0001` | Muestra cliente, fecha y direcciones correctos; las direcciones no muestran accesos; el historial tiene un evento "criado" con el nombre de quien lo creó; no hay panel de enlace; las notas aparecen vacías | Persona | Pendiente |
| B10 | Pestañas sin datos | Abrir en el detalle las pestañas Inventário y Propostas | Estado vacío, sin error ni pantalla en blanco | Persona | Pendiente |
| B11 | Rutas inválidas | Abrir `/pt/orders/abc` y `/pt/orders/MD-9999` | Ambas muestran la página de "no encontrado" | Persona | Pendiente |
| B12 | Persistencia | Detener y reiniciar el servidor y abrir `/pt/orders` | Los pedidos creados siguen en la lista | Persona | Pendiente |
| B13 | Idiomas | Repetir B7 y B9 en `/es` y `/en` | No hay textos sin traducir ni claves visibles | Persona | Pendiente |
| B14 | Sin sesión | Cerrar sesión y abrir `/pt/orders` | Redirige al login | Persona | Pendiente |
| B15 | Pedido de otra empresa | Con una segunda empresa activa (si existe), abrir el `MD-0001` de la primera | Muestra "no encontrado", igual que un pedido inexistente | Persona | Pendiente |

## C. Datos guardados

Se ejecutan después de la sección B, con lo que haya creado la persona.

| ID | Qué se comprueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| C1 | `orders` y `shipments` | Un envío por pedido y los números `1, 2, 3...` sin saltos | Claude | Pendiente |
| C2 | `inventories` | Cada pedido tiene la versión 1, sin `submitted_at`; `filled_by` es `client` si se eligió enlace y `company` si lo rellena la empresa | Claude | Pendiente |
| C3 | `addresses` e `inventory_addresses` | Origen, paradas y destino con el texto escrito, `sort_order` correlativo (origen 0, destino el último) y los accesos por defecto | Claude | Pendiente |
| C4 | `shipment_events` y `audit_log` | Un evento `created` por envío, con el nombre de quien lo creó en `data.by`, y una fila `order_created` por pedido | Claude | Pendiente |
| C5 | `clients` | Un solo cliente para todos los pedidos con el mismo teléfono | Claude | Pendiente |
| C6 | `orders.link_validity_days` | Es 14 en el pedido con enlace y `null` en el que rellena la empresa | Claude | Pendiente |
| C7 | Fechas | `desired_date` y `date_flexibility` coinciden con lo escrito en el formulario | Claude | Pendiente |

## D. Regresión

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| D1 | `/fleet` y `/fleet/new` | Cargan y crear un vehículo sigue funcionando | Persona | Pendiente |
| D2 | Inicio, Clientes, Agenda y Propostas | Cargan con sus datos de ejemplo, sin error | Persona | Pendiente |
| D3 | `pnpm lint` y `pnpm typecheck` en la raíz | Terminan sin errores en las tres apps | Claude | OK (10/11/2026) |
| D4 | Avisos de seguridad de Supabase | No aparece ninguna alerta nueva respecto al estado del 10/11/2026 (sí figuran las de `shipment_counters` sin políticas y las funciones `security definer`, ambas intencionadas) | Claude | OK (10/11/2026) |

## Criterio de salida del paso 4a

El paso 4a se da por validado cuando:

1. Todos los casos de las secciones A, B y C están en `OK`.
2. Los casos de seguridad (A9, A10, A11, A12, A13 y B15) pasan sin excepción. Un fallo en cualquiera de ellos bloquea el paso al 4b.
3. La sección D está en `OK`.
4. Quedan registradas las limitaciones conocidas, que no son fallos:
   - el enlace del cliente no se genera (paso 4b);
   - Inventário y Propostas salen vacíos;
   - la pantalla Clientes sigue con datos de ejemplo;
   - la cancelación no tiene pantalla (RF-69).

## Registro de fallos

| Caso | Fecha | Qué se vio | Qué se esperaba | Estado |
| --- | --- | --- | --- | --- |
| B6 | 11/11/2026 | Con 2 paradas, "Pedido criado" y el detalle (Resumo y Moradas) solo mostraban origen y destino. Las paradas sí estaban en la base de datos | Las paradas visibles y en el orden escrito | Corregido en código (paradas en los tres sitios y en el formulario de accesos del inventario). Pendiente de repetir B6 |

