# Mudaro · Plan de pruebas del paso 4b (inventario y enlace)

Fecha: 18/11/2026 (sección G añadida el 19/11/2026)
Alcance: tablas, restricciones, RLS y funciones del inventario con líneas, las correcciones de cada empresa y el enlace del cliente (migraciones `20261118200000` a `20261118200300`). La sección F prueba la pantalla Inventário de `apps/company` y la G, el acceso del cliente por su enlace (migración `20261119100000`, Edge Function `client-order` y `apps/client`).
Fuera de alcance: las fotos (bucket de Storage), el límite de peticiones de `client-order` (pendiente antes de enviar enlaces a clientes reales, ver `docs/plan-modelo-bd.md`) y los presupuestos (paso 5).
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
| A3 | Días de validez en el evento | El evento `link_shared` lleva `linkValidityDays` (lo lee el historial de la app) | Claude | OK (18/11/2026) |

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

## E. Guardar el borrador de una vez (`save_inventory_draft`, migración `20261118300100`)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| E1 | Guardado completo | Objetos, accesos (piso, ascensor, escaleras, estacionamiento, notas) y extras quedan guardados | Claude | OK (18/11/2026) |
| E2 | Segundo guardado | Quita la línea que no viene, actualiza la que cambia sin crear otra fila (mismo id) y añade la nueva | Claude | OK (18/11/2026) |
| E3 | Secciones nulas | Con accesos y extras nulos, no cambian | Claude | OK (18/11/2026) |
| E4 | Extras vacíos | `[]` desmarca todos los extras | Claude | OK (18/11/2026) |
| E5 | Datos inválidos | Línea repetida, cantidad 0, objeto inexistente, dirección ajena y JSON que no es lista se rechazan, y el borrador queda como estaba | Claude | OK (18/11/2026) |
| E6 | Otra empresa | `not allowed` | Claude | OK (18/11/2026) |
| E7 | Versión nueva | Tras `open_inventory_draft()`, guardar conserva `previous_line_id`; al enviar, `base_changed` es true solo en la línea cambiada | Claude | OK (18/11/2026) |

## F. Pantalla Inventário (`apps/company`)

Con sesión de administrador y un pedido nuevo creado eligiendo "Eu, agora ou numa visita" (la empresa rellena el inventario). Datos de prueba, nunca reales.

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| F1 | Catálogo real | Salen 6 divisiones (Sala, Quarto, Cozinha, Casa de banho, Escritório, Caixas) y sus objetos con nombre en el idioma de la interfaz | Persona | OK (19/11/2026) |
| F2 | Guardar al cambiar de paso | Añadir objetos y pulsar "Continuar para acessos": el pie dice "Guardado". Recargar la página: las cantidades siguen ahí | Persona | OK (19/11/2026) |
| F3 | Mismo objeto en dos divisiones | Añadir 2 cadeiras en Sala y 4 en Cozinha: cada división cuenta las suyas y al recargar se mantienen por separado | Persona | OK (19/11/2026) |
| F4 | Accesos | Rellenar los accesos de todos los puntos, ir a Extras y recargar: los accesos siguen ahí | Persona | OK (19/11/2026) |
| F5 | Accesos incompletos | Dejar el ascensor sin elegir en un punto y pulsar "Concluir inventário": vuelve a Acessos con el aviso de accesos obligatorios y el pedido no cambia de estado | Persona | OK (19/11/2026) |
| F6 | Guardar e sair | Cambiar una cantidad y pulsar "Guardar e sair": vuelve al detalle; al volver a Inventário el cambio está | Persona | OK (19/11/2026) |
| F7 | Concluir | Con objetos y accesos completos, "Concluir inventário" lleva al detalle; el pedido está en "Inventário recebido", la pestaña Inventário muestra v1 con sus divisiones, objetos y volumen, y el historial tiene "Inventário enviado" | Persona | OK (19/11/2026) |
| F8 | Lista de pedidos | La fila del pedido en "Inventário recebido" muestra el número de objetos y el volumen reales | Persona | OK (19/11/2026) |
| F9 | Editar una versión enviada | Abrir Inventário del pedido enviado: sale "Inventário v1 enviado…" con "Editar inventário". Pulsarlo abre el editor con "Nova versão (v2)" y todo lo de la v1. Concluir: el detalle muestra v2 | Persona | OK (19/11/2026) |
| F10 | Extras | Marcar un extra con nota, concluir: Resumo del detalle lo lista | Persona | OK (19/11/2026) |

**Ejecución del 19/11/2026.** Hecha en Chrome sobre `localhost:3001`, con un administrador de prueba de "Mudanzas Peru" y el pedido MD-0004 (`Cliente Teste`, ya existía como cliente). Catálogo revisado en ES y en PT. Notas que no son fallos:
- F7: el historial dice "A empresa preencheu o inventário (v1)". Es el texto previsto para un inventario de la empresa; "Inventário enviado" del criterio era una descripción.
- F10: el Resumo lista "Embalagem" pero no su nota. La nota se guarda (vuelve al abrir la v2).
- F5: con un acceso incompleto se puede pasar a Extras y el paso Acessos sale marcado como hecho. El bloqueo llega al concluir, que es lo que pide el criterio.
- Fuera de la sección F: en "Novo pedido", en la primera ejecución el nombre llegó vacío al servidor, pero al repetirlo el 19/11/2026 el nombre se envía bien; lo más probable es que fuera un efecto de la escritura automática. Lo que sí pasa: un error del servidor se queda bajo el campo aunque lo corrijas, hasta el siguiente envío. En Pedidos, el banner dice "2 clientes já enviaram o inventário" aunque uno lo rellenó la empresa.

## G. Acceso del cliente por su enlace (B9, migración `20261119100000`, Edge Function `client-order`, `apps/client`)

G1 a G9 se ejecutaron en un solo bloque SQL con la sesión simulada del administrador de "Mudanzas Peru" sobre MD-0005: abre un borrador, genera un enlace y llama a las funciones `client_*` con el hash del token. El bloque termina con un error forzado, así que no quedó nada (comprobado después: MD-0005 sigue en v1, sin borrador y sin cancelar). G10 llama a la Edge Function publicada con tokens inventados. G11 se hizo en Chrome.

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| G1 | Permisos | `anon` y `authenticated` no pueden ejecutar `client_save_inventory_draft` ni `client_submit_inventory` (42501). Solo `service_role` | Claude | OK (19/11/2026) |
| G2 | Enlace desconocido o mal formado | Un hash que no existe y un texto que no es un hash dan "link not found" | Claude | OK (19/11/2026) |
| G3 | Guardar con enlace vigente | El borrador guarda la línea con la cantidad enviada | Claude | OK (19/11/2026) |
| G4 | Objeto que no existe | Un objeto fuera del catálogo da "catalog item not found" y no se guarda | Claude | OK (19/11/2026) |
| G5 | Enviar desde el enlace | Devuelve la versión (v2), el envío pasa a `inventory_received` y el historial registra `actor_type = 'client'`, sin usuario, con el nombre de contacto | Claude | OK (19/11/2026) |
| G6 | Sin borrador abierto | Con el inventario ya enviado, guardar da "no draft inventory" | Claude | OK (19/11/2026) |
| G7 | Enlace caducado | Guardar y enviar dan "link expired" aunque haya borrador | Claude | OK (19/11/2026) |
| G8 | "Gerar link novo" | El enlace anterior da "link not found"; el nuevo guarda | Claude | OK (19/11/2026) |
| G9 | Pedido cancelado | El enlace da "link not found" (no revela que el pedido existe) | Claude | OK (19/11/2026) |
| G10 | Edge Function publicada | Token mal formado: 400 `invalid_input`. Token de 64 caracteres que no existe, al leer y al guardar: 404 `not_found`. GET: 405 | Claude | OK (19/11/2026) |
| G11 | Flujo completo en el navegador | Desde `apps/company`, "Gerar link" en MD-0005. En `apps/client` se abre el pedido con el catálogo, se añaden objetos y accesos ("Guardado" al cambiar de paso), se marca un extra y "Enviar inventário" muestra "Inventário enviado". En la empresa: "Inventário recebido", "Preenchido pelo cliente" y "O cliente enviou o inventário (v1)" en el historial. Un enlace inventado muestra "Este link não é válido" | Claude (Chrome) | OK (19/11/2026) |

Regresión de la empresa tras la migración (19/11/2026): con MD-0004, guardar el borrador al cambiar de paso ("Guardado") y concluir la v3 siguen funcionando; el historial registra "A empresa preencheu o inventário (v3)".

## Criterio de salida del paso 4b

1. Todos los casos están en `OK`.
2. Los casos de seguridad (sección D) pasan sin excepción.
3. Quedan registradas las limitaciones conocidas, que no son fallos:
   - la obligatoriedad de los accesos (RF-23) la valida la app, porque la base tiene valores por defecto;
   - una línea borrada entre versiones no deja marca;
   - `client-order` aún no limita la frecuencia de peticiones (pendiente antes de enviar enlaces a clientes reales);
   - las fotos no se guardan (sin bucket de Storage);
   - los presupuestos no pasan a `superseded` al enviar una versión nueva (paso 5).

## Registro de fallos

| Caso | Fecha | Qué se vio | Qué se esperaba | Estado |
| --- | --- | --- | --- | --- |
| C4 | 18/11/2026 | En revisión, antes de aplicar: las correcciones se copiaban al abrir el borrador, así que una corrección hecha después se perdía en la versión nueva | La corrección pasa a la versión nueva | Corregido antes de aplicar (se copian al enviar). Probado en C4 |
| A3 | 18/11/2026 | En revisión: el evento del enlace guardaba `expiresAt` y la app lee `linkValidityDays`; el historial habría mostrado 0 días | El evento lleva los días de validez | Corregido en `20261118200300`, aplicada el 18/11/2026. Probado en A3 |
