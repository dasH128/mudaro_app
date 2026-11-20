# Mudaro · Plan del paso 6 (agenda, ejecución y cierre)

Fecha: 20/11/2026
Estado: acordado el 20/11/2026 (todo desde el panel del administrador, puntos P1 a P14 confirmados).
Objetivo: que el trabajo nacido al aceptar el orçamento (paso 5.6) se pueda planificar, ejecutar y cerrar. La empresa asigna vehículo y equipo sin solapes, registra recogida, incidencias y entrega, y cierra el trabajo con horas y km reales para exportarlo y facturar (RF-47 a RF-60).
Rama: `feat/jobs`, creada desde `main` después de mergear `feat/quotes`. Un commit por sub-paso.

## Decisión del 20/11/2026: todo desde el panel, la app después

En el paso 6 nadie usa una app móvil. El administrador lo hace todo desde `apps/company`, y el conductor y el resto del equipo reciben el aviso del trabajo por los canales que ya usa la empresa (teléfono, WhatsApp).

- Lo que un administrador puede hacer desde el panel se hace en este paso: agenda, asignaciones, fotos, actas, incidencias, cierre y exportación.
- Lo que solo tiene sentido con la app del operario se pospone hasta que exista: invitar operarios (RF-03), vista del operario (RF-49), trabajo sin conexión (RF-56) y firma del cliente en el móvil sobre una incidencia (RF-54).
- **Mismas tablas para el panel y la app.** Fotos, actas e incidencias se guardan en las tablas definitivas (`evidence`, `handover_records`, `incidents`), con quién lo registró (`recorded_by`) y desde dónde (`source`: `panel` o `app`). Cuando llegue la app añadirá filas a esas mismas tablas; la ficha del trabajo, el cierre, el CSV y el bloqueo tras cerrar no cambian.
- **Personas sin cuenta, vinculables después.** El equipo se da de alta como personas de la empresa sin login. Cuando llegue la app, a esa misma persona se le vincula una cuenta y conserva su historial.

## Punto de partida

- `jobs` mínimo (`20261119300000_quotes`): `company_id`, `shipment_id` único, `quote_id`, `status` (`scheduled`, `in_progress`, `delivered`, `closed`, `cancelled`) y `scheduled_start` a las 09:00 de Lisboa. Solo lectura para administradores. Falta `scheduled_end`, horas y km reales, notas y cierre.
- Agenda (`/schedule`): diseño hecho con datos de ejemplo más los trabajos reales, que salen "por atribuir". La hora de fin se calcula con las horas estimadas del orçamento.
- Equipa (`/team`): solo diseño con datos de ejemplo. La pantalla usa la función de la persona (motorista, ajudante, chefe de equipa), que no existe en la base.
- Frota (`/fleet`): listar, detalle y alta. Faltan editar y desactivar (RF-05), y RF-05 exige que un vehículo inactivo no salga en la agenda.
- Bucket `signatures` (`20261119400000_signatures_bucket`) para las firmas de aceptación del orçamento.
- Prototipos: "P0 · Operações de hoje" y "P7 · Tabuleiro + painel do veículo". No hay prototipo de la ficha del trabajo, del registro de recogida y entrega ni del cierre.

## Puntos acordados

| # | Qué | Decisión | Estado | Afecta |
| --- | --- | --- | --- | --- |
| P1 | **Panel o app** | Todo desde el panel; la app del operario se pospone (ver arriba). No se escribe todavía el contrato para Flutter | Acordado | Todo |
| P2 | **Personas del equipo** | Tabla `crew_members` (`company_id`, `name`, `phone`, `position`, `active`, `user_id` opcional y único hacia `company_users`). Se asignan personas, no usuarios. `user_id` queda vacío hasta la app | Acordado | 6.0, 6.1 |
| P3 | **Función de la persona** | Enum `crew_position` (`driver`, `loader`, `foreman`) en `crew_members.position`. No da permisos, solo informa al asignar. El jefe de equipo del trabajo se marca en la asignación (`assignments.is_lead`) | Acordado | 6.0, 6.1 |
| P4 | **Periodo de la asignación** | `jobs.scheduled_end` se guarda: inicio más las horas estimadas del orçamento, editable. Cada asignación copia el periodo del trabajo; reprogramar mueve trabajo y asignaciones en la misma función. Restricción `exclude using gist` sobre `(vehicle_id, period)` y `(crew_member_id, period)` con `btree_gist` (RF-48) | Acordado | 6.1 |
| P5 | **Qué se puede asignar** | La base rechaza vehículos y personas inactivos (RF-05). Capacidad menor que el volumen o menos personas que las del orçamento: aviso en pantalla, no bloqueo | Acordado | 6.1, 6.2 |
| P6 | **Recogida y entrega desde el panel** (RF-52, RF-55) | El administrador registra el acta con nombre de quien firma, fecha y hora en que se firmó (escrita a mano) y observaciones. Adjuntar la foto del acta en papel es opcional. Registrar la recogida pasa el trabajo a `in_progress`; registrar la entrega, a `delivered`, y exige la recogida antes. `handover_records.signature_path` queda vacío cuando viene del panel y es obligatorio cuando venga de la app | Acordado | 6.4, 6.5 |
| P7 | **Ficheros** (RF-51, RF-52, RF-55, RNF-05) | Bucket privado `job-evidence` para fotos y fotos de actas en papel (JPEG o PNG, hasta unos 5 MB), con rutas `company_id/job_id/...`. Sube y lee el administrador de la empresa; la ficha los muestra con URLs firmadas y temporales. Sin política de borrado en Storage. El plazo de conservación sigue abierto (sección 11) | Acordado | 6.4 |
| P8 | **Horas de lo registrado** | Cada foto, acta e incidencia guarda dos horas: cuándo pasó (`taken_at`, `signed_at`, `occurred_at`, escrita por el administrador) y cuándo se registró (`recorded_at`, la pone la base). Las fotos del panel no llevan ubicación | Acordado | 6.4 |
| P9 | **Corregir errores e inmutabilidad** (RF-57) | Con registros manuales habrá errores. Antes del cierre, el administrador puede eliminar una foto, un acta o una incidencia registrada desde el panel; queda un evento en el historial (RNF-08). Al cerrar, un trigger bloquea cualquier cambio en el trabajo y en todo lo que cuelga de él, también a las funciones | Acordado | 6.4, 6.6 |
| P10 | **Estados de la incidencia** (RF-53, RF-59) | Enum `incident_status` con `open` y `resolved`. Resolver exige una nota. Cerrar el trabajo exige que ninguna esté en `open`. `accepted` y `disputed` (firma del cliente, RF-54) se añaden con la app | Acordado | 6.4, 6.6 |
| P11 | **Exportación** (RF-60) | CSV en UTF-8 con BOM, separador `;` y coma decimal, para que Excel en portugués lo abra bien. Una fila por línea del orçamento aceptado (base, extras elegidos, manuales) más una por incidencia con importe, con número del pedido, número del orçamento, cliente, NIF, fecha, IVA y total. Lo genera un Route Handler de `apps/company` con la sesión del administrador (sin clave de servicio). Filtro por fechas de cierre | Acordado | 6.7 |
| P12 | **Diseños** | Como en el paso 5: versión funcional con la línea de diseño del panel lateral de la Agenda (`job-panel.tsx`), y después la rediseñas | Acordado | 6.2, 6.3, 6.5 |
| P13 | **Acta imprimible** | Desde la ficha del trabajo, imprimir un acta de recogida y otra de entrega con los datos del pedido y hueco para la firma. El conductor la lleva y el administrador sube la foto firmada (P6) | Acordado | 6.5 |
| P14 | **Un operario en varias empresas** (sección 11, abierta) | Una empresa por persona en el MVP. No bloquea nada | Acordado | Ninguno |

## Sub-pasos

### 6.0 · Equipa y Frota reales (prerrequisito)

Sin personas ni vehículos reales no hay nada que asignar.

- **Base de datos:** enum `crew_position` y tabla `crew_members` (P2, P3) con RLS por `company_id` (RNF-01). Funciones del administrador para crear, editar, desactivar y reactivar personas. Para vehículos, `update_vehicle()` y `set_vehicle_active()` con motivo (RF-05).
- **`apps/company`:** Equipa conectada (lista, detalle, alta, editar, desactivar); se retiran los datos de ejemplo. Frota con editar y desactivar.
- Se puede partir en 6.0a (Frota, pequeño) y 6.0b (Equipa).

### 6.1 · Base de datos de la agenda (RF-47, RF-48, RF-50)

Migración `2026112…_assignments.sql`:

- `jobs`: añadir `scheduled_end`, `notes`, `actual_hours`, `actual_km`, `closed_at`, `closed_by`, `cancelled_at` y `cancel_reason`. Rellenar `scheduled_end` de los trabajos existentes con las horas del orçamento.
- `assignments`: `company_id`, `job_id`, `vehicle_id` o `crew_member_id` (exactamente uno), `is_lead`, `period`. Restricciones `exclude` de P4, claves compuestas con `company_id` como en el resto del esquema.
- Funciones del administrador: `set_job_assignments(p_job_id, p_vehicle_ids, p_crew_member_ids, p_lead_id)` (sustituye las asignaciones del trabajo en una sola transacción; un solape devuelve un error con el recurso en conflicto para que la pantalla lo diga), `reschedule_job(p_job_id, p_start, p_end)` y `cancel_job(p_job_id, p_reason)` (borra las asignaciones, RF-50).
- Eventos en el historial del envío: equipo asignado, reprogramado, cancelado (RNF-08).
- RLS: lectura para administradores de la empresa. Escritura solo por funciones.
- `pnpm db:types`.

### 6.2 · Agenda conectada (RF-47, RF-48, RF-50)

- `schedule.repo.ts` lee vehículos, personas, trabajos y asignaciones reales; se retiran los datos de ejemplo.
- Panel del trabajo: asignar vehículo y equipo, marcar jefe de equipo, cambiar fecha y hora, cancelar con motivo. Avisos de P5 y error claro cuando la base rechaza un solape.
- La fila "Por atribuir" queda para los trabajos sin asignar.
- Detalle del pedido: la tarjeta "Trabalho agendado" muestra vehículo y equipo.

### 6.3 · Ficha del trabajo en `apps/company`

- Ruta `/[lang]/jobs/[id]` (la entrada "Trabalho" ya está declarada en `ROUTES`). "Ver trabalho" de la lista de pedidos y de la agenda lleva aquí.
- Resumen, dirección y accesos, contacto del cliente, asignaciones y estimado frente a real.
- Botón para copiar un resumen sin precios (fecha, hora, direcciones, accesos, contacto) y mandarlo al equipo por WhatsApp o donde la empresa quiera.

### 6.4 · Base de datos de la ejecución (RF-51 a RF-53, RF-55, RF-57)

Migración `2026112…_job_execution.sql` y el bucket de P7:

- Enums `job_moment` (`pickup`, `delivery`, `incident`), `incident_type` (`damage`, `undeclared_item`, `delay`, `access`, `other`), `incident_status` (P10) y `record_source` (`panel`, `app`).
- Tablas `evidence`, `incidents` y `handover_records` según el DBML, con `source`, `recorded_by`, `recorded_at` y las horas de P8.
- Funciones del administrador:
  - `add_evidence()`: foto con momento y hora (RF-51, RF-55).
  - `record_pickup()`: acta de recogida; pasa el trabajo a `in_progress` (RF-52).
  - `record_delivery()`: acta de entrega; pasa a `delivered` (RF-55).
  - `report_incident()` y `resolve_incident()` (RF-53, P10).
  - Eliminar registros del panel antes del cierre (P9).
- Triggers de bloqueo tras el cierre (P9, RF-57).
- Probarlo en la base con SQL antes de las pantallas, como el 4b y el 5.

### 6.5 · Ejecución en la ficha del trabajo

- Secciones de recogida, incidencias y entrega: subir fotos, registrar actas, registrar y resolver incidencias, eliminar antes del cierre.
- Las fotos se ven con URLs firmadas y temporales (RNF-05).
- Acta imprimible de recogida y de entrega (P13).

### 6.6 · Cierre del trabajo (RF-58, RF-59)

- Función `close_job(p_job_id, p_actual_hours, p_actual_km)`: solo administrador, solo con el trabajo en `delivered`, horas y km obligatorios (RF-58) y sin incidencias `open` (RF-59). Registra el evento y activa el bloqueo de P9.
- En la ficha: formulario de cierre y el motivo por el que no se puede cerrar si falta algo.
- Las horas reales alimentan la métrica de precisión del piloto (sección 9); el informe es RF-61 (P1), fuera de este paso.

### 6.7 · Exportación CSV (RF-60)

- Route Handler `/[lang]/jobs/export` con el formato de P11. Comprueba sesión y rol en el servidor; lee con RLS.
- Botón "Exportar" en una lista de trabajos cerrados (filtro por fechas). Si no hay lista de trabajos, desde la Agenda o desde Relatórios: decidir al llegar, según el diseño.

### 6.8 · Operações de hoje conectada (opcional en este paso)

La portada (prototipo P0) usa datos de ejemplo. Con el 6.1 a 6.6 hechos ya hay datos reales para conectarla: trabajos de hoy, en curso, incidencias abiertas y pendientes de cierre. Se puede dejar para después del plan de pruebas.

### 6.9 · Plan de pruebas

`docs/test-plan-jobs-6.md` con el formato del 4a, 4b y 5: solapes (vehículo y persona, en el borde del periodo), vehículo y persona inactivos, aislamiento entre empresas, orden de estados (no hay entrega sin recogida), eliminar antes del cierre y bloqueo después, cierre bloqueado por incidencias abiertas, ficheros de otra empresa inaccesibles, y el CSV abierto en Excel en portugués. Pantallas en Chrome.

## Para cuando exista la app del operario

- Invitar operarios y vincular la cuenta a su `crew_members` (RF-03).
- Vista del operario sin precios (RF-49, RNF-03): funciones `security definer` que devuelven solo lo necesario, sin abrir RLS de `quotes`, `orders` ni `inventories`.
- Fotos, actas e incidencias desde el móvil, con `source = 'app'`, firma dibujada y ubicación.
- Sin conexión (RF-56, RNF-07): `id` generados en el móvil, funciones idempotentes y orden de sincronización.
- Firma del cliente sobre la incidencia (RF-54): estados `accepted` y `disputed`.
- Contrato para Flutter en `docs/operator-app-contract.md`.

## Fuera del paso 6

- Informe de estimado frente a real (RF-61, P1) y expediente PDF del trabajo (RF-62, P1).
- Email al cliente con las actas (RF-64, P1) y notificaciones push (RF-63).
- Plazo de conservación de fotos y actas (sección 11).
- Límite de peticiones de `client-order` (sigue pendiente antes de enlaces a clientes reales).

## Orden y tamaño

| Sub-paso | Tamaño | Depende de |
| --- | --- | --- |
| 6.0 Equipa y Frota | Medio | P2, P3 |
| 6.1 Base de datos de la agenda | Medio | 6.0, P4, P5 |
| 6.2 Agenda conectada | Medio | 6.1, P12 |
| 6.3 Ficha del trabajo | Medio | 6.1, P12 |
| 6.4 Base de datos de la ejecución | Medio | 6.1, P6 a P10 |
| 6.5 Ejecución en la ficha | Medio | 6.3, 6.4, P13 |
| 6.6 Cierre | Pequeño | 6.4 |
| 6.7 CSV | Pequeño | 6.6, P11 |
| 6.8 Operações de hoje | Medio, opcional | 6.6 |
| 6.9 Pruebas | Medio | Todo lo anterior |
