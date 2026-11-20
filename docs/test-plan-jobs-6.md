# Mudaro · Plan de pruebas del paso 6 (agenda, ejecución y cierre)

Fecha: 20/11/2026
Alcance: frota (migración `20261120100000`), equipa sin cuenta (`20261120200000`), agenda y asignaciones (`20261120300000` y `20261120300100`), ejecución con fotos, actas e incidencias (`20261120400000`), cierre (`20261120500000`), y las pantallas de `apps/company`: Frota, Equipa, Nova pessoa, Agenda, ficha del trabajo, acta imprimible, exportación CSV y Operações de hoje.
Fuera de alcance: la app del operario (RF-03, RF-49, RF-54, RF-56: fase de la app, ver `docs/plan-paso-6-trabajos.md`), el límite de peticiones de `client-order` y el tema oscuro.
Fuentes: `docs/plan-paso-6-trabajos.md` y `docs/test-plan-quotes-5.md` (formato).

## Cómo usar este documento

- Cada caso tiene un **criterio de aceptación**: el caso pasa solo si se cumple tal cual está escrito.
- **Quién** indica quién ejecuta el caso: *Claude* (SQL dentro de una transacción que se deshace, o en Chrome) o *Persona*.
- **Estado** es `Pendiente`, `OK (fecha)` o `Fallo`.
- Un fallo se registra en la sección "Registro de fallos" del final.

## Preparación

| Elemento | Valor |
| --- | --- |
| Proyecto Supabase | `mudaro_app` (`hqatdrtcasoxlgucsjyh`), las seis migraciones del paso 6 aplicadas y registradas en el historial. Las de `20261120300000` en adelante las ejecutó la persona en el editor SQL |
| Sesión simulada | `request.jwt.claims` con el id de un administrador activo y rol `authenticated`: "Mudanzas Peru" y, para el aislamiento, la segunda empresa de pruebas. `client_accept_quote` con `service_role`, como la Edge Function |
| Datos de prueba | MD-0005 (`Cliente Teste`, 20/12/2026), que se deja siempre en "Programado" al acabar; MD-0006 (`Cliente Teste 2 (pruebas 6.9)`, 20/11/2026), creado el 20/11/2026 para las pruebas de cierre y exportación con las funciones reales (`create_order` → `submit_inventory` → `send_quote` → `client_accept_quote`) y ya **cerrado**; vehículo "Bonbonli 1" y persona "Rui Teste Silva" |
| Pantallas | `pnpm dev --filter=company` en http://localhost:3001 con una cuenta de administrador de "Mudanzas Peru" |

## A. Frota (RF-05, paso 6.0a)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| A1 | Editar datos | `update_vehicle_data` guarda tipo, capacidad, carga y coste y deja un evento por dato cambiado; repetir la llamada no duplica eventos | Claude | OK (20/11/2026) |
| A2 | Desactivar y reactivar | `set_vehicle_active` exige motivo al desactivar; repetir el mismo estado no deja evento | Claude | OK (20/11/2026) |
| A3 | Pantalla | En el panel, cambiar la capacidad y salir del campo guarda y sale en el histórico; un valor no numérico muestra el error del campo; el interruptor pide el motivo antes de desactivar | Claude | OK (20/11/2026) |

## B. Equipa sin cuenta (P2, P3, paso 6.0b)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| B1 | Alta y edición | `create_crew_member` limpia espacios del nombre; `update_crew_member` deja un evento por dato cambiado y no duplica | Claude | OK (20/11/2026) |
| B2 | Aislamiento (RNF-01) | El administrador de otra empresa ve 0 personas y editar una ajena da `P0002` | Claude | OK (20/11/2026) |
| B3 | Teléfono | Un teléfono mal formado da `23514`; desde la pantalla, "9123" muestra "Telemóvel inválido" | Claude | OK (20/11/2026) |
| B4 | Sin escritura directa | Insertar en `crew_members` como `authenticated` da `42501` | Claude | OK (20/11/2026) |
| B5 | Pantalla | Estado vacío con "Adicionar a primeira pessoa"; alta en `/team/new` vuelve con el panel abierto; editar nombre y función al salir del campo; desactivar con motivo y reactivar | Claude | OK (20/11/2026) |

## C. Agenda y asignaciones (RF-47, RF-48, RF-50, paso 6.1 y 6.2)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| C1 | Fin por defecto | Un trabajo nuevo recibe `scheduled_end` = inicio + horas del orçamento (MD-0006: 09:00 → 12:00 con 3 h) | Claude | OK (20/11/2026) |
| C2 | Solape de vehículo | El mismo vehículo en otro trabajo que se solapa da `23P01` con el recurso y el trabajo en conflicto | Claude | OK (20/11/2026) |
| C3 | Solape de persona | Igual que C2 con una persona | Claude | OK (20/11/2026) |
| C4 | Periodos que se tocan | Un trabajo que acaba a las 10:00 y otro que empieza a las 10:00 comparten vehículo y persona | Claude | OK (20/11/2026) |
| C5 | Reprogramar encima de otro | Rechazado con `23P01`; las asignaciones no se mueven | Claude | OK (20/11/2026) |
| C6 | Jefe y equipo | Jefe que no está en el equipo da `23514`; asignar sin jefe funciona (fallo corregido en `20261120300100`) | Claude | OK (20/11/2026) |
| C7 | Inactivos (RF-05, P5) | Asignar una persona o un vehículo inactivo da `23514` | Claude | OK (20/11/2026) |
| C8 | Cancelar | `cancel_job` exige motivo, deja el trabajo cancelado y sin asignaciones; reprogramar un cancelado da `55000` | Claude | OK (20/11/2026) |
| C9 | Aislamiento | Otra empresa ve 0 asignaciones y cancelar un trabajo ajeno da `P0002` | Claude | OK (20/11/2026) |
| C10 | Pantalla | Asignar vehículo, persona y jefe desde el panel; reprogramar (fin antes del inicio da error); el pedido muestra horario, vehículo y equipo | Claude | OK (20/11/2026) |
| C11 | Cancelar desde la pantalla | "Cancelar trabalho" con motivo saca el trabajo de la agenda | Persona | Pendiente |

## D. Ficha del trabajo (paso 6.3)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| D1 | Ficha | `/pt/jobs/MD-0005` muestra horario, equipo, moradas con accesos, estimado, cliente e histórico | Claude | OK (20/11/2026) |
| D2 | Resumen sin precios (RNF-03) | El resumen para el equipo no lleva importes | Claude | OK (20/11/2026) |
| D3 | No encontrado | `/pt/jobs/MD-9999` muestra "Trabalho não encontrado" | Claude | OK (20/11/2026) |

## E. Ejecución: actas, fotos e incidencias (RF-51 a RF-53, RF-55, paso 6.4 y 6.5)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| E1 | Orden de estados | Sin recogida no hay entrega ni incidencias (`55000`); la recogida pasa a `in_progress` y la entrega a `delivered` | Claude | OK (20/11/2026) |
| E2 | Ruta de las fotos | Una ruta fuera de `<empresa>/<trabajo>/` da `22023` | Claude | OK (20/11/2026) |
| E3 | Resolver | Resolver sin nota da `23514` y en pantalla "Indica como ficou resolvida" | Claude | OK (20/11/2026) |
| E4 | Eliminar antes del cierre (P9) | Quitar la entrega vuelve a `in_progress`; la recogida no se puede quitar con incidencias; eliminar una incidencia devuelve las rutas de sus fotos; el bucket queda vacío | Claude | OK (20/11/2026) |
| E5 | Aislamiento | Otra empresa ve 0 fotos y actas, registrar en un trabajo ajeno da `P0002` | Claude | OK (20/11/2026) |
| E6 | Storage (RNF-05) | Otra empresa no sube (`42501`) ni lee ficheros; el administrador sube a un trabajo abierto, no a uno cerrado (`42501`) | Claude | OK (20/11/2026) |
| E7 | Pantalla | Recogida, foto (comprimida y vista con enlace firmado), incidencia de 25,50 €, resolverla, entrega con foto del acta y eliminar todo, en MD-0005 | Claude | OK (20/11/2026) |
| E8 | Acta imprimible (P13) | `/pt/print/jobs/MD-0005/delivery` sin menú lateral ni precios, con huecos de firma | Claude | OK (20/11/2026) |
| E9 | Fotos desde un móvil | Subir fotos desde el navegador de un teléfono (incluida una foto HEIC de iPhone) | Persona | Pendiente |
| E10 | Impresión real | Imprimir el acta en papel y comprobar que cabe en una hoja A4 | Persona | Pendiente |

## F. Cierre (RF-57 a RF-59, paso 6.6)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| F1 | Solo entregados | Cerrar un trabajo programado da `55000` | Claude | OK (20/11/2026) |
| F2 | Incidencias abiertas (RF-59) | Con una abierta da `23514`; en pantalla, aviso "Há 1 incidência(s) por resolver" y botón desactivado (MD-0006) | Claude | OK (20/11/2026) |
| F3 | Horas y km (RF-58) | 0 horas da `22023`; sin horas, en pantalla "Indica as horas reais" | Claude | OK (20/11/2026) |
| F4 | Cerrar | MD-0006 cerrado desde la ficha con 3,5 h y 28 km: estado "Fechado", "Real: 3,5 h e 28 km", evento en el histórico | Claude | OK (20/11/2026) |
| F5 | Bloqueo (RF-57) | Tras cerrar no se puede volver a cerrar ni cambiar asignaciones, fotos ni actas, ni siquiera como `postgres`; la ficha ya no ofrece editar, añadir fotos ni eliminar | Claude | OK (20/11/2026) |

## G. Exportación CSV (RF-60, paso 6.7)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| G1 | Contenido | Exportar el 20/11/2026 da 3 filas de MD-0006: servicio 200,00 €, línea manual 4 × 2,50 €, incidencia 15,00 €; IVA 23 % por línea; las líneas del orçamento suman 258,30 € con IVA, lo firmado | Claude | OK (20/11/2026) |
| G2 | Formato | BOM UTF-8 (`EF BB BF`), separador `;`, coma decimal, fechas dd/mm/aaaa; celdas con `;` o comillas entre comillas | Claude | OK (20/11/2026) |
| G3 | Inyección | Una descripción que empieza por `=` sale con un apóstrofo delante | Claude | OK (20/11/2026) |
| G4 | Fechas inválidas | Fechas al revés o mal escritas vuelven a la Agenda con el aviso | Claude | OK (20/11/2026) |
| G5 | Excel en portugués | Abrir el CSV en Excel: columnas separadas, acentos bien, importes como números que se pueden sumar | Persona | Pendiente |

## H. Operações de hoje (paso 6.8)

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| H1 | Datos reales | La portada muestra trabajos de hoy, en curso, incidencias abiertas, pedidos por etapa, actividad y flota de Supabase, sin datos de ejemplo ni errores en consola | Claude | OK (20/11/2026) |

## Decisiones registradas durante las pruebas

- **IVA de las incidencias (20/11/2026, confirmado por la persona).** El importe adicional de una incidencia es sin IVA; la exportación le aplica el IVA del orçamento.

## Registro de fallos

| Fecha | Caso | Qué pasó | Corrección |
| --- | --- | --- | --- |
| 20/11/2026 | C6 | Asignar sin jefe de equipo fallaba con `23502`: `c = null` daba null en `is_lead` | Migración `20261120300100_fix_set_job_assignments.sql` |
| 20/11/2026 | A3 | La lista del histórico del vehículo repetía claves con dos cambios iguales el mismo día | Clave por id de `audit_log` |
| 20/11/2026 | E8 | La página del acta avisaba de datos sin `<Suspense>` (cacheComponents) | `loading.tsx` en la ruta |
| 20/11/2026 | H1 | La actividad reciente repetía claves con varios eventos del mismo pedido | Clave por id del evento |
| 20/11/2026 | — | Turborepo reutilizaba el typecheck de las apps tras cambiar los tipos de Supabase | `typecheck` depende de `^typecheck` en `turbo.json` |
