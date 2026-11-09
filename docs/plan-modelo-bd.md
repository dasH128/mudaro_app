# Mudaro · Plan del modelo de base de datos

Fecha: 25/10/2026 · Actualizado: 09/11/2026
Fuentes: `requirement-mvp.md`, `architecture-system.md`, `supabase/CLAUDE.md`.
Modelo vigente: `docs/diagram/mudaro-model.dbml` (nombres en inglés, comentarios en español). Sustituye al documento "Modelo de negocio y dominio", que no está en el repo y usaba una solicitud en lugar de pedido y envío.

## Estado por pasos

Cada paso es una o más migraciones nuevas en `supabase/migrations/`. Nunca se edita una migración ya aplicada.

| Paso | Bloque | Tablas | Migraciones | Requisitos | Estado |
| --- | --- | --- | --- | --- | --- |
| 1 | Base | `platform_users`, `companies`, `company_internal`, `company_users`, `invitations`, `audit_log` | `20261025100000` a `20261025100600` y `20261101100000` (8 archivos) | RF-03, RF-65 a RF-68, RNF-01, RNF-08 | Creado |
| 2 | Configuración | `vehicles`, `vehicle_costs` | `20261101200000_vehicles` | RF-05 | Parcial |
| 2 | Configuración (pendiente) | `tariffs`, `company_extras`, `company_items` | | RF-06, RF-07, RF-09 | Pendiente. Los extras esperan un análisis |
| 3 | Catálogo global | `catalog_*` (7 tablas) | `20261103100000_catalog` | RF-10, RF-11, RF-12 | Creado |
| 4 | Pedidos | `clients`, `orders`, `shipments`, `addresses`, `inventories`, `inventory_lines`, `inventory_extras` | | RF-13 a RF-27, RF-69, RNF-02 | Pendiente |
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
- Direcciones, inventarios, líneas y extras de inventario cuelgan del pedido, sin `company_id`. Su RLS se resuelve por `shipments`: una empresa los lee si tiene un envío en ese pedido, así las políticas no cambian cuando haya varias empresas. `quotes` sí repite `company_id` para su RLS (RNF-01).
- Cancelación (RF-69): `orders.cancelled_at`, motivo, `cancelled_by_type` (`company` o `client`) y `cancelled_by_id`. Solo la cambia `cancel_order()`, en una transacción: autoriza por dueño del pedido (`account_id` si existe y, si no, `created_by_company_id`), cancela los envíos vivos, cancela el trabajo si está `scheduled` y bloquea todo si está `in_progress` o `delivered`, registra el evento y `audit_log`, y avisa a las demás empresas con envío vivo (en el MVP, a nadie). Un envío `cancelled` no se reactiva. "Perdido" (`lost`, con `lost_reason`) es otro estado. Las penalizaciones por cancelar un pedido ganado no se diseñan todavía (fases 2 y 3).
- Número visible: va en `shipments.number`, con secuencia propia de cada empresa y `unique(company_id, number)`. Pedido y envío comparten ese número para la empresa (RF-17). El cliente no lo ve: con cuentas se añadirá `orders.reference`, un código corto no secuencial. Si estuviera en `orders`, cada empresa vería saltos y podría estimar el volumen de la plataforma.
- Enlace opcional: `orders.token_hash` y `token_expires_at` son nulos hasta que se comparte el enlace por primera vez (si la empresa rellena el inventario, RF-19, no hay enlace). Van juntos, con un `check`. Reenviar genera un token nuevo, porque solo se guarda el hash.
- Notas e historial: tablas nuevas `shipment_notes` (editables, privadas de cada empresa) y `shipment_events` (solo se inserta). No se usa `audit_log`: las empresas no pueden leerlo y es inmutable, lo que impediría corregir una nota con datos personales (RGPD). `note_added` guarda solo el id de la nota.
- Fechas de actividad: `shipments.status_changed_at` y `last_activity_at`. El segundo lo actualiza un trigger de `shipment_events`; `set_updated_at` no sirve porque un borrador de inventario no cambia la fila del envío.

**Versiones y cambios tras aceptar (pasos 4 y 5)**

- Un cambio de cálculo o de accesos crea una versión nueva del inventario; fotos y notas no. La versión nueva copia los ajustes manuales y marca las líneas cuya base cambió.
- Los presupuestos enviados con la versión anterior pasan a `superseded`. El aceptado sigue vigente hasta que se acepte el nuevo (`quotes.supersedes_id` encadena las versiones). El envío no vuelve atrás de `won` y el trabajo no se recrea. El día de la mudanza el cambio se registra como incidencia con importe y firma.

## Pendiente del modelo de pedido y envío (revisión del 09/11/2026)

La lista completa, con un código por punto, está al final de `docs/diagram/mudaro-model.dbml` (secciones A a D). Resumen para no perderlo:

- **Antes de migrar el paso 4:** comprobar el historial de migraciones en Supabase (D1) y partir el paso en 4a (clientes, pedidos, envíos, notas, historial, direcciones sin accesos, `create_order()`, `cancel_order()`, RLS) y 4b (inventario, accesos versionados, extras, enlace) (D2).
- **Correcciones de diseño sin aplicar (A1 a A9):** los accesos de `addresses` no están versionados y RF-27 lo exige (el más grave, bloquea 4b); faltan campos en `inventory_lines`; restricciones de coherencia entre `quotes`, `inventories` y `shipments`; índice único temporal por pedido; triggers de inmutabilidad en `shipment_events`; número de presupuesto.
- **Decisiones abiertas (B1 a B11):** nombre `shipments`, convención de enums (guion o guion bajo), quién lee las notas, extras, borradores de presupuesto ante una versión nueva, caducidad del enlace (7 días en RF-15 y 14 en el código), tabla de notificaciones, dónde se construye la web del cliente, qué reciben las demás empresas cuando una gana (fase 3) y las penalizaciones por cancelar un pedido ganado (fases 2 y 3).
- **Documentación por corregir (D3):** solo quedan los DBML antiguos de `docs/diagram/` (`mudaro-model-es_v1.dbml` y `requests-model.dbml`), que hay que borrar o marcar como históricos.
- **Impacto en `apps/company` (D4):** renombrar `proposals` a `quotes`, `requestId` a `orderId`, mover el estado del pedido al envío con `cancelled` e implementar RF-69.

## Pendiente de decidir

- **Servicios extra.** `inventory_extras` apunta a los extras de cada empresa, pero el inventario es del pedido. Falta decidir entre un catálogo global de tipos de extra con precio por empresa, o elegir los extras al presupuestar. Bloquea `company_extras` (paso 2) y la parte de extras del paso 4.
- Qué hacer si se da de alta una empresa con un NIF que ya existe. Hoy hay `unique` sobre `(country_code, tax_id)`, lo que bloquea el alta.
- Región: lista cerrada aún por definir. Hoy es texto libre.
- Caducidad real del convite (depende de la configuración de Supabase Auth).
- Flujos pendientes del panel: editar empresa, registrar IMT o RGPD después del alta, desactivar un usuario concreto.

## Notas operativas

- Los comentarios de algunas migraciones usan una numeración antigua de pasos ("Paso 5" en `create_company`, "Paso 2/4" en el renombrado del NIF) y el del catálogo habla de "solicitud". No se editan: la referencia es la tabla de estado de este documento.
- Por verificar: según una nota de octubre, las migraciones del paso 1 se aplicaron a mano en Supabase y el historial de migraciones del proyecto estaba vacío. Un `supabase db push` intentaría reaplicarlas y habría que usar `supabase migration repair`. Comprobar el estado actual antes de empezar el paso 4.
