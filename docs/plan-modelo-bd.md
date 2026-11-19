# Mudaro · Plan del modelo de base de datos

Fecha: 25/10/2026 · Actualizado: 18/11/2026
Fuentes: `requirement-mvp.md`, `architecture-system.md`, `supabase/CLAUDE.md`.
Modelo vigente: `docs/diagram/mudaro-model.dbml` (nombres en inglés, comentarios en español). Sustituye al documento "Modelo de negocio y dominio", que no está en el repo y usaba una solicitud en lugar de pedido y envío.

## Estado por pasos

Cada paso es una o más migraciones nuevas en `supabase/migrations/`. Nunca se edita una migración ya aplicada.

| Paso | Bloque | Tablas | Migraciones | Requisitos | Estado |
| --- | --- | --- | --- | --- | --- |
| 1 | Base | `platform_users`, `companies`, `company_internal`, `company_users`, `invitations`, `audit_log` | `20261025100000` a `20261025100600` y `20261101100000` (8 archivos) | RF-03, RF-65 a RF-68, RNF-01, RNF-08 | Creado |
| 2 | Configuración | `vehicles`, `vehicle_costs` | `20261101200000_vehicles` | RF-05 | Parcial |
| 2 | Configuración (pendiente) | `tariffs`, `company_items` | | RF-06, RF-09 | Pendiente |
| 2 y 4b | Servicios extra | `catalog_extras`, `catalog_extra_translations`, `company_extras`, `inventory_extras` | `20261118100000_extras` | RF-07, RF-24 | Creado (aplicada a mano y registrada en el historial el 18/11/2026). La app solo lee los tipos |
| 3 | Catálogo global | `catalog_*` (7 tablas) | `20261103100000_catalog` y `20261118300000_catalog_pilot_items` (datos del piloto) | RF-10, RF-11, RF-12 | Creado. 27 objetos en 6 divisiones, valores provisionales |
| 4 | Pedidos | `clients`, `orders`, `shipments`, `addresses`, `inventories`, `inventory_addresses`, `inventory_lines`, `inventory_line_adjustments` | 4a: `20261109100000` a `20261109100200`. 4b: `20261118200000` a `20261118200300` y `20261118300100_save_inventory_draft` | RF-13 a RF-27, RF-37, RF-69, RNF-02 | 4a creado y validado (`docs/test-plan-orders-4a.md`). 4b creado y probado en base de datos (`docs/test-plan-inventory-4b.md`). Pantalla Inventário de `apps/company` conectada el 18/11/2026. Botón del enlace en `apps/company` y escrituras del cliente (B9: `20261119100000_client_link_writes` y Edge Function `client-order`) aplicados y probados el 19/11/2026 (secciones F y G de `docs/test-plan-inventory-4b.md`). **4b cerrado el 19/11/2026** |
| 5 | Presupuestos | `quotes`, `quote_lines`, `acceptances` | | RF-30 a RF-46 | Pendiente |
| 6 | Ejecución | `jobs`, `assignments`, `incidents`, `evidence`, `handover_records` | | RF-47 a RF-62 | Pendiente |

La autenticación no es un bloque de tablas. Supabase Auth gestiona las cuentas y el esquema solo modela los vínculos: qué cuenta es de plataforma, a qué empresa pertenece cada usuario y qué invitaciones están pendientes.

Las fichas de cliente no son un bloque aparte: pertenecen a cada empresa y se crean junto al envío (paso 4). El cliente final no tiene cuenta en el MVP; la tabla de cuentas de cliente (`client_accounts`) es de la fase 3.

## Convenciones

- Tablas, columnas, funciones, enums y políticas en inglés. Comentarios SQL en español.
- El pedido es `orders` y el envío, `shipments`. Los importes van en céntimos.
- Los términos portugueses sin equivalente directo se explican en un comentario (`tax_id` es el NIF).
- Las escrituras no van directas desde el navegador: pasan por Edge Functions o por funciones `security definer` que sacan la identidad y la empresa de la sesión.

## Decisiones tomadas

**Acceso y roles (paso 1)**

- Un operario pertenece a una sola empresa: la clave primaria de `company_users` es el `id` de Auth. Si la decisión abierta de "operario en varias empresas" cambia, habrá que añadir una tabla intermedia.
- MFA obligatorio para plataforma: lo exige `is_platform_user()` (`aal2`), así la base de datos lo impide aunque la app no lo compruebe.
- `companies` lleva `country_code` (ISO 3166-1 alfa-2, por defecto `PT`). La unicidad es por `(country_code, tax_id)` y el dígito de control del NIF solo se valida cuando el país es `PT`.
- Notas internas, origen y región van en `company_internal`, con RLS solo para plataforma.
- La invitación no guarda token: el enlace y su token los genera Supabase Auth. `invitations` solo guarda el estado. Una única invitación pendiente de administrador por empresa (índice parcial). Caducidad de 7 días, provisional.
- La auditoría es inmutable: triggers bloquean `update`, `delete` y `truncate`. Sin clave foránea en `company_id`, para que el registro sobreviva a una empresa borrada.

**Vehículos (paso 2)**

- El coste por km va en `vehicle_costs`, aparte: RLS filtra filas, no columnas, y el operario lee los vehículos de su empresa pero nunca los costes (RNF-03). Sin fila significa "falta el coste por km".
- Las altas pasan por `create_vehicle()`: solo el administrador, matrícula normalizada (AA-00-AA) y rastro de auditoría en la misma transacción.
- Un vehículo inactivo no se propone en cálculos ni en la agenda (RF-05).

**Catálogo (paso 3)**

- Global, sin `company_id`. Lo mantiene el equipo Mudaro desde `apps/admin` y lo leen todas las empresas. Las escrituras pasan por Edge Functions que validan el rol de plataforma y registran el evento en `audit_log`.
- Una fila de traducción por idioma. El portugués es obligatorio.
- Los objetos nunca se borran, se desactivan, porque las líneas de inventario los referencian. El `slug` no cambia después de crearse.
- Búsqueda sin acentos por nombre y sinónimos (`search_catalog_items`, RF-11).

**Pedido y envío (paso 4, 09/11/2026)**

- `orders` es la mudanza (contacto, fecha, enlace, direcciones, inventario). `shipments` es el pedido enviado a una empresa (estado y presupuestos). Hay un envío por empresa: `unique(order_id, company_id)`. El límite de uno por pedido en el MVP lo impone la aplicación, no la base de datos.
- `orders` guarda `contact_name` y `contact_phone`. La ficha `clients` (privada de cada empresa) se vincula con `shipments.client_id`, y debe ser de la misma empresa del envío: se fuerza con una clave compuesta o un trigger.
- Dueño del pedido: hoy `orders.created_by_company_id` (la empresa creadora); con cuentas, `account_id`, y la columna queda como histórico. El dueño no se deduce de `client_id`.
- Enlace: `orders.token_hash` guarda solo el hash (RNF-02). Caduca a los 7 días por defecto, configurable. La caducidad solo bloquea editar el inventario: el cliente sigue pudiendo ver y aceptar un presupuesto vigente. Lo valida una Edge Function.
- Direcciones, inventarios, líneas y extras de inventario cuelgan del pedido, sin `company_id`. `addresses` solo guarda el hueco (origen, destino o parada); el texto, las coordenadas y los accesos viven en `inventory_addresses`, por versión del inventario. `create_order()` crea la versión 1 en borrador con las direcciones. Su RLS se resuelve por `shipments`: una empresa los lee si tiene un envío en ese pedido, así las políticas no cambian cuando haya varias empresas. `quotes` sí repite `company_id` para su RLS (RNF-01).
- Cancelación (RF-69): `orders.cancelled_at`, motivo, `cancelled_by_type` (`company` o `client`) y `cancelled_by_id`. Solo la cambia `cancel_order()`, en una transacción: autoriza por dueño del pedido (`account_id` si existe y, si no, `created_by_company_id`), cancela los envíos vivos, cancela el trabajo si está `scheduled` y bloquea todo si está `in_progress` o `delivered`, registra el evento y `audit_log`, y avisa a las demás empresas con envío vivo (en el MVP, a nadie). Un envío `cancelled` no se reactiva. "Perdido" (`lost`, con `lost_reason`) es otro estado. Las penalizaciones por cancelar un pedido ganado no se diseñan todavía (fases 2 y 3).
- Número visible: va en `shipments.number`, con secuencia propia de cada empresa y `unique(company_id, number)`. Pedido y envío comparten ese número para la empresa (RF-17). El cliente no lo ve: con cuentas se añadirá `orders.reference`, un código corto no secuencial. Si estuviera en `orders`, cada empresa vería saltos y podría estimar el volumen de la plataforma.
- Enlace opcional: `orders.token_hash` y `token_expires_at` son nulos hasta que se comparte el enlace por primera vez (si la empresa rellena el inventario, RF-19, no hay enlace). Van juntos, con un `check`. Reenviar genera un token nuevo, porque solo se guarda el hash.
- Notas e historial: tablas nuevas `shipment_notes` (editables, privadas de cada empresa) y `shipment_events` (solo se inserta). No se usa `audit_log`: las empresas no pueden leerlo y es inmutable, lo que impediría corregir una nota con datos personales (RGPD). `note_added` guarda solo el id de la nota.
- Fechas de actividad: `shipments.status_changed_at` y `last_activity_at`. El segundo lo actualiza un trigger de `shipment_events`; `set_updated_at` no sirve porque un borrador de inventario no cambia la fila del envío.

**Servicios extra (18/11/2026, resuelve B5)**

- Modelo híbrido. Mudaro mantiene el catálogo global de tipos (`catalog_extras`, con traducciones como el resto del catálogo). Cada empresa crea sus servicios en `company_extras`, con nombre, modo de precio y precio propios, colgando de un tipo (`catalog_extra_id`) o sin tipo si es un servicio propio. Un solo nivel: tipo y servicios de la empresa, sin árbol.
- El cliente, o la empresa que rellena el inventario, marca tipos en `inventory_extras` como referencia, con una nota opcional y **sin cantidad**: cada empresa calcula la cantidad con el inventario que recibe. No marcar nada es válido.
- Al presupuestar, la empresa ve los tipos marcados y elige qué servicio suyo aplica, con cantidad y precio. Puede añadir servicios aunque el cliente no los marcara. Si el cliente marcó un tipo que la empresa no ofrece, la pantalla lo avisa.
- Los servicios propios (sin tipo) no se ofrecen en el inventario: solo aparecen en el presupuesto.
- Los extras forman parte de la versión del inventario: cambiarlos en una versión enviada abre un borrador nuevo, como el resto (A10).
- El modo de precio incluye `m3_month` para el guarda-muebles.
- Descubrimiento (fase 3, sin construir): qué empresas ofrecen un tipo sale de `company_extras.catalog_extra_id`.
- Pendiente para el paso 5: `quote_lines.company_extra_id` (clave compuesta con `company_id`), líneas opcionales que el cliente marca o desmarca al aceptar y cómo guarda `acceptances` la selección y el importe firmado (el cálculo lo hace el servidor).

**Inventario por capas y enlace (paso 4b, 18/11/2026, resuelve A2, A10, A11 y B7)**

- Dos capas. `inventory_lines` guarda lo que declara el cliente (o la empresa cuando rellena ella, RF-19): pertenece al pedido y es igual para todas las empresas. `inventory_line_adjustments` guarda lo que corrige cada empresa sobre una línea (RF-37): es privada de esa empresa, y el valor sugerido es el de la línea.
- La línea no referencia `company_items`. El ajuste de un objeto del catálogo para una empresa (RF-09) lo aplica cada empresa al calcular. Así el 4b no depende del paso 2.
- Objeto del catálogo: volumen, peso y minutos se copian del catálogo al crear la línea o al cambiar de objeto, y no cambian si el catálogo cambia después (RF-39). Objeto libre: descripción obligatoria y volumen opcional; sin volumen, `needs_review` (RF-21, RF-36).
- Versiones (A10 y A11 confirmadas): el borrador se edita en sitio y se cierra al enviarlo. La versión vigente es la última enviada. `open_inventory_draft()` abre la siguiente copiando direcciones, extras y líneas (con `previous_line_id`). `submit_inventory()` marca `base_changed` en las líneas nuevas o con la base distinta y copia las correcciones de cada empresa. Se copian al enviar, no al abrir, para no perder las hechas con el borrador abierto. Solo se corrige la versión vigente.
- `submit_inventory()` exige al menos una línea y una dirección en cada hueco. Los accesos tienen valores por defecto, así que su obligatoriedad (RF-23) la valida la app. Una línea borrada entre versiones no deja marca: se ve comparando versiones.
- Enlace (B7: 7 días por defecto): `share_order_link()` genera 32 bytes aleatorios, devuelve el token una sola vez y guarda su hash SHA-256 en hexadecimal. Reenviar genera otro token y el anterior deja de valer. Pasa el envío de `new` a `awaiting_inventory` y registra `link_shared` o `link_resent` con `linkValidityDays`, nunca el token. La Edge Function que valide el enlace (cuando se decida B9) tiene que calcular el hash igual.
- Escriben solo el administrador de la empresa dueña del pedido (`lock_owned_order()`, interna, que también rechaza pedidos cancelados y bloquea la fila), salvo `set_line_adjustment()`, que vale para cualquier empresa con envío en el pedido.
- `save_inventory_draft()` (18/11/2026) guarda de una vez, en una transacción, los objetos del catálogo, los accesos y los extras del borrador. Cada sección es opcional (nula = no se toca). Las líneas se reconocen por (objeto, división): las que ya existen se actualizan y conservan `previous_line_id`, así `base_changed` sigue funcionando. Los objetos libres no se tocan.
- Escrituras del cliente (B9, 19/11/2026, `20261119100000_client_link_writes`): el cuerpo de `save_inventory_draft` y `submit_inventory` pasa a las funciones internas `write_inventory_draft` y `close_inventory_draft`, sin cambiar su comportamiento. `client_save_inventory_draft` y `client_submit_inventory` reciben el hash del token (lo calcula la Edge Function `client-order`), bloquean el pedido con `lock_order_by_link` (mismo error si no existe o está cancelado; con el enlace caducado no se escribe) y solo las ejecuta `service_role`. El historial registra el envío con `actor_type = 'client'` y el nombre de contacto del pedido.
- Fuera del 4b: el bucket de Storage para las fotos y pasar a `superseded` los presupuestos al enviar una versión nueva (paso 5).

**Versiones y cambios tras aceptar (pasos 4 y 5)**

- Un cambio de cálculo, de direcciones o de accesos crea una versión nueva del inventario; fotos y notas no. La versión nueva copia los ajustes manuales y marca las líneas cuya base cambió.
- Los presupuestos enviados con la versión anterior pasan a `superseded`. El aceptado sigue vigente hasta que se acepte el nuevo (`quotes.supersedes_id` encadena las versiones). El envío no vuelve atrás de `won` y el trabajo no se recrea. El día de la mudanza el cambio se registra como incidencia con importe y firma.

## Pendiente del modelo de pedido y envío (revisión del 09/11/2026)

La lista completa, con un código por punto, está al final de `docs/diagram/mudaro-model.dbml` (secciones A a D). Resumen para no perderlo:

- **Antes de migrar el paso 4:** comprobar el historial de migraciones en Supabase (D1) y partir el paso en 4a (clientes, pedidos, envíos, notas, historial, direcciones, `inventories` e `inventory_addresses`, `create_order()`, `cancel_order()`, RLS) y 4b (líneas de inventario y enlace) (D2). `inventory_extras` va en la migración de servicios extra.
- **Aplicado el 09/11/2026 (A1):** direcciones y accesos versionados en `inventory_addresses`. A10 y A11 confirmados el 18/11/2026 (ver "Inventario por capas"). Queda qué pasa con `jobs.quote_id` al aceptar un presupuesto nuevo (A12).
- **Correcciones de diseño sin aplicar (A6 a A9; A2 resuelto el 18/11/2026):** restricciones de coherencia entre `quotes`, `inventories` y `shipments`; índice único temporal por pedido; triggers de inmutabilidad en `shipment_events`; número de presupuesto.
- **Decisiones abiertas (B1 a B11):** nombre `shipments`, convención de enums (guion o guion bajo), quién lee las notas, extras (resuelto el 18/11/2026), borradores de presupuesto ante una versión nueva, caducidad del enlace (resuelto el 18/11/2026: 7 días), tabla de notificaciones, dónde se construye la web del cliente (resuelto el 19/11/2026: `apps/client` con Next.js; falta el dominio), qué reciben las demás empresas cuando una gana (fase 3) y las penalizaciones por cancelar un pedido ganado (fases 2 y 3).
- **Documentación por corregir (D3):** solo quedan los DBML antiguos de `docs/diagram/` (`mudaro-model-es_v1.dbml` y `requests-model.dbml`), que hay que borrar o marcar como históricos.
- **Impacto en `apps/company` (D4):** renombrar `proposals` a `quotes`, `requestId` a `orderId`, mover el estado del pedido al envío con `cancelled` e implementar RF-69.

## Pendiente de decidir

- **Extras opcionales en el presupuesto (paso 5).** Si la empresa puede marcar un extra como obligatorio, y cómo se guarda la selección del cliente al aceptar.
- Qué hacer si se da de alta una empresa con un NIF que ya existe. Hoy hay `unique` sobre `(country_code, tax_id)`, lo que bloquea el alta.
- Región: lista cerrada aún por definir. Hoy es texto libre.
- Caducidad real del convite (depende de la configuración de Supabase Auth).
- Flujos pendientes del panel: editar empresa, registrar IMT o RGPD después del alta, desactivar un usuario concreto.

## Pendiente de revisar antes de enviar enlaces a clientes reales (19/11/2026)

- **Límite de peticiones de `client-order`.** La Edge Function del cliente es pública (sin sesión) y hoy no limita cuántas veces se la puede llamar. Adivinar un enlace no es el riesgo (32 bytes aleatorios); el riesgo es el consumo: un script podría gastar invocaciones y consultas, o alguien con un enlace válido guardar el borrador sin parar. Propuesta: un contador por IP y por token en Postgres (ventanas de un minuto, unas 60 peticiones) que la función consulta al empezar, sin servicio externo. Antes de implementarlo, comprobar si Supabase ofrece ya un límite por función.
- **Texto del panel del enlace en `apps/company`.** Dice "Cliente pode alterar o inventário até aceitar uma proposta", pero una vez enviado el inventario el cliente ya no puede editar desde el enlace. Cambiar el texto o permitir que el cliente abra una versión nueva (RF-27, P1).

## Notas operativas

- Los comentarios de algunas migraciones usan una numeración antigua de pasos ("Paso 5" en `create_company`, "Paso 2/4" en el renombrado del NIF) y el del catálogo habla de "solicitud". No se editan: la referencia es la tabla de estado de este documento.
- Por verificar: según una nota de octubre, las migraciones del paso 1 se aplicaron a mano en Supabase y el historial de migraciones del proyecto estaba vacío. Un `supabase db push` intentaría reaplicarlas y habría que usar `supabase migration repair`. Comprobar el estado actual antes de empezar el paso 4.
