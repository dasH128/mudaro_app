# Mudaro · Plan del paso 5 (presupuestos)

Fecha: 19/11/2026
Objetivo: cerrar el ciclo del MVP. La empresa calcula y envía el presupuesto desde el inventario, el cliente lo ve en su enlace, elige los extras opcionales y lo acepta con firma, y el pedido pasa a "Ganho" con un trabajo programado (RF-06, RF-07, RF-30 a RF-46).
Rama: `feat/quotes`, creada desde `main`. Un commit por sub-paso.

## Decisiones tomadas (19/11/2026)

Detalle en `docs/requirement-mvp.md`, sección 11.

1. **Extras incluidos u opcionales.** Cada línea de extra es *incluida* o *opcional*. El cliente marca o desmarca las opcionales y ve el total al momento. La aceptación guarda lo elegido y el importe firmado.
2. **Inventario nuevo con presupuesto enviado.** El presupuesto pasa a `superseded`: el cliente no lo puede aceptar y la empresa recibe el aviso para recalcular.
3. **Tarifa según RF-06.** El cálculo usa horas, km, operarios, suplementos, mínimo y estiba. La empresa elige cómo lo presenta: precio cerrado o precio por hora con estimación.
4. **`proposals` pasa a `quotes`** al empezar, antes de escribir código nuevo. La interfaz dice "Orçamento".
5. **Al aceptar**, el pedido pasa a "Ganho" y se crea un trabajo programado (fecha, cliente y dirección). Equipo y vehículo, en el paso 6.

## Puntos acordados antes de empezar

**Acordado el 19/11/2026: se aplican todas las recomendaciones de la tabla.** Matices: en P2 la empresa escribe los km en el piloto y el servicio de mapas se decide después; en P3 los valores son solo el punto de partida y cada empresa los cambia en su tarifa.

| # | Qué | Recomendación | Bloquea |
| --- | --- | --- | --- |
| P1 | **Diseños.** No hay prototipos de Tarifas, editor de orçamento ni de la vista del cliente (`docs/design/company` y `docs/design/customer`) | Igual que con la web del cliente: primero una versión funcional siguiendo la línea de diseño de las listas de `apps/company`, y después la rediseñas | 5.1, 5.4, 5.5 |
| P2 | **Servicio de mapas** (RF-34, decisión abierta) | En el piloto, la empresa escribe los km (campo en el editor, con la distancia de la base incluida). Elegir servicio (Google, OpenRouteService…) y su coste aparte, sin frenar el resto | 5.3 |
| P3 | **Regla de operarios** (RF-32) y **valores iniciales** de estiba y acceso (decisiones abiertas) | Valores por defecto editables en la tarifa: estiba 1,20; operarios 2 hasta 15 m³, 3 hasta 30 m³ y 4 por encima, +1 si hay objetos de "pessoal extra"; acceso +10 % de horas por piso sin elevador y +5 % por cada 25 m de estacionamiento. Confirmarlos con 3 o 4 empresas del piloto | 5.3 |
| P4 | **PDF** (RF-38: "página web y PDF") | MVP: la página del orçamento con estilo de impresión ("Guardar como PDF" del navegador). Un PDF generado en servidor, si las empresas lo piden, más adelante | 5.5 |
| P5 | **Huella del documento** (RF-43) | Hash SHA-256 del `snapshot` del orçamento enviado (líneas, totales, condiciones e inventario anexo), calculado en la base al enviar. Es lo que firma el cliente; no depende de cómo se pinte el PDF | 5.2 |
| P6 | **Firma** | Imagen PNG del trazo en un bucket privado de Storage (`signatures`), que solo escribe la Edge Function del cliente. El plazo de conservación sigue abierto (sección 11) | 5.5 |
| P7 | **Número del orçamento** (A9) | Secuencia por empresa, como el pedido: `ORC-0001`. Las versiones comparten número (v1, v2) | 5.2 |
| P8 | **Cambio de presupuesto aceptado** (A12) | Si el cliente acepta uno nuevo antes de la mudanza, `jobs.quote_id` apunta al nuevo y el cambio queda como evento en el historial | 5.6 |
| P9 | **Caducidad** (RF-45) | Sin tareas programadas: se calcula al leer (`valid_until` anterior a hoy = caducado) y la función de aceptar lo vuelve a comprobar | 5.2 |
| P10 | **Pruebas del cálculo** | El motor de cálculo es TypeScript puro y conviene probarlo con tests unitarios. El repo no tiene herramienta de tests: proponer `vitest` solo en `packages/` (pedir permiso antes de añadirlo) | 5.3 |

## Sub-pasos

### 5.0 · Renombrar `proposals` a `quotes` (C5, D4) · hecho el 19/11/2026

Sin cambios visibles. Unos 46 ficheros, 25 claves por idioma y la ruta.

- `apps/company/features/proposals/` → `features/quotes/` (tipos, repo, textos, componentes).
- `app/[lang]/(app)/proposals/` → `quotes/`; `ROUTES.proposals` → `ROUTES.quotes`; `NavKey`.
- Diccionarios: claves `proposals` → `quotes` y textos "Proposta" → "Orçamento" (PT), "Propuesta" → "Presupuesto" (ES), "Proposal" → "Quote" (EN).
- `requestId` → `orderId` donde aplique.
- `apps/company/CLAUDE.md`.

### 5.1 · Tarifa y servicios de la empresa (RF-06, RF-07) · hecho el 19/11/2026

Migración `20261119200000_tariffs` (aplicada y registrada). Valores por defecto de la v1: 15 €/h de precio y 9 €/h de coste por operário, 0,60 €/km, mínimo 120 €, estiba 1,20, 50 km/h, IVA 23 %, +10 % de horas por andar sem elevador, +5 % por cada 25 m, operários 2/3/4 (hasta 15 y 30 m³), preço fechado y 15 días de validez. Provisionales: confirmarlos con empresas del piloto.

Es lo que falta del paso 2 y el cálculo lo necesita.

- **Base de datos** (`supabase/migrations/2026112…_tariffs.sql`): tabla `tariffs` versionada (modelo del DBML más el modo de presentación: cerrado u hora, y las reglas de operarios y acceso de P3). Funciones `save_tariff()` (crea versión nueva, RF-06) y `save_company_extra()` / `set_company_extra_active()` (la tabla `company_extras` ya existe). RLS: solo administradores (RNF-03). Al dar de alta una empresa se crea la tarifa v1 con los valores por defecto.
- **`apps/company`**: página `/pricing` (Tarifas) con dos bloques: tarifa (campos de RF-06) y servicios extra (lista, alta, edición, activar o desactivar, con su tipo del catálogo y su modo de precio). `features/pricing/{domain,application,infrastructure,presentation}`.
- `pnpm db:types`.

### 5.2 · Base de datos de presupuestos · hecho el 19/11/2026

Migraciones `20261119300000_quotes` y `20261119300100_fix_save_quote_draft` (aplicadas y registradas). Diferencias con lo previsto: el estado no guarda "caducado" (P9, se calcula con `valid_until`); rechazar pasa el envío a `lost` con el motivo y una versión nueva lo devuelve a `quoted`; el trabajo se programa en la fecha deseada del pedido a las 09:00 de Lisboa. Probado en la base el 19/11/2026 (flujo normal, versiones, rechazo, caducidad, inventario nuevo y permisos); los casos pasan al plan de pruebas en 5.7.

Migración `2026112…_quotes.sql` y su RLS:

- Enums `quote_status` (draft, sent, accepted, rejected, expired, superseded) y `line_origin` (calculated, manual).
- `quotes`: el modelo del DBML más `number` (P7), `pricing_mode` (cerrado u hora), `document_hash` (P5), `rejected_reason` (RF-44).
- `quote_lines`: más `kind` (base, extra, manual), `optional` (decisión 1) y la clave compuesta a `company_extras`.
- `acceptances`: más `selected_line_ids` y `signed_total_cents` (decisión 1), `signature_path` (P6), `ip`, `document_hash`.
- `jobs` mínimo (decisión 5): `company_id`, `shipment_id` único (A6), `quote_id` (A12), `status`, `scheduled_start`.
- Restricciones A6 de presupuestos: `quotes.company_id` igual al del envío, `quotes.inventory_id` del mismo pedido.
- Funciones:
  - `save_quote_draft()`: crea o actualiza el borrador de la empresa sobre la versión vigente del inventario.
  - `send_quote()`: congela el `snapshot`, calcula el hash, fija la validez, pasa el envío a `quoted` y registra `quote_sent`. Un orçamento enviado no se edita: cambiarlo crea la versión siguiente (RF-42).
  - `close_inventory_draft()` (de `20261119100000`): al enviar una versión nueva del inventario, los presupuestos `sent` del pedido pasan a `superseded` (decisión 2).
  - `client_accept_quote()` y `client_reject_quote()` (solo `service_role`, por el hash del enlace, como en el 4b): comprueban que el orçamento está enviado, no caducado ni sustituido, y que el pedido no está cancelado. Aceptar guarda la aceptación, pasa el envío a `won`, crea el trabajo y registra el evento.

### 5.3 · Motor de cálculo (RF-30 a RF-37) · hecho el 19/11/2026

Explicación completa para el equipo: `docs/quote-calculation.md`.

Vive en `packages/quotes` (y no en `apps/company/features/quotes/domain`) para probarlo con `vitest` como se acordó en P10: 20 tests, `pnpm test`. Reglas concretas, provisionales: los minutos de manipulación del catálogo son minutos de una persona para cargar una unidad y otros tantos para descargarla; carga en el origen, descarga en el destino y cada parada suma un cuarto de la carga; el elevador pequeño cuenta la mitad de los pisos; las horas del equipo se redondean hacia arriba a la media hora; el suplemento de estacionamiento se aplica desde 50 m, el mismo umbral que el detalle del pedido.

TypeScript puro, sin base de datos. Vive en `apps/company/features/quotes/domain/calculate.ts` (solo lo usa la empresa; el cliente solo suma las líneas elegidas).

- Volumen con estiba (RF-30), vehículos según la capacidad de la frota y viajes (RF-31), operarios por tramos (RF-32), horas con factor de acceso (RF-33), km (RF-34, a mano según P2), precio sugerido, coste y margen con mínimo (RF-35), alertas (RF-36) y ajuste manual guardando sugerido y final (RF-37).
- Cálculo por hora o cerrado según `pricing_mode`.
- Tests unitarios si se aprueba P10.

### 5.4 · Editor de orçamento y lista en `apps/company`

5.4a (editor) hecho el 19/11/2026: ruta `/[lang]/orders/[id]/quote`. Enviar pide confirmación (no se deshace). El motor acepta operários y horas a mano (`calculateQuote(input, overrides)`, con tests). 5.4b hecho el 19/11/2026: lista Orçamentos conectada (se retira `mock-data.ts`), pestaña Orçamentos del pedido con las versiones, su estado y el aviso de inventario nuevo, y la nota de la lista de pedidos con la versión y la validez reales. Se quitan las rutas `/quotes/new` y `/quotes/<id>`: un orçamento se crea y se ve desde su pedido.

- Ruta `/[lang]/orders/[id]/quote`: desde "Criar orçamento" del detalle del pedido y de la lista.
- Editor: datos sugeridos y finales lado a lado, líneas (base, extras propuestos a partir de los tipos que marcó el cliente, líneas manuales), cada extra *incluido* u *opcional*, modo de precio, validez, condiciones (plantilla simple; la plantilla editable de RF-40 es P1), alertas de RF-36, coste y margen solo para administradores (RNF-03). "Guardar rascunho" y "Enviar orçamento".
- Lista Orçamentos (`/quotes`) conectada a Supabase: se retiran `mock-data.ts` y `CAN_SEE_MARGIN`.
- Detalle del pedido: pestaña Orçamentos con las versiones y su estado, y el aviso "desactualizado" (decisión 2).

### 5.5 · Orçamento en la web del cliente (`apps/client`) · hecho el 19/11/2026

Migración `20261119400000_signatures_bucket` (bucket privado, solo PNG de hasta 256 KB; lo escribe la Edge Function y lo lee el administrador de la empresa). Probado en el navegador con MD-0005: opcional elegido, firma, aceptación (196,80 €), pedido Ganho y trabajo programado. El rechazo está probado en la base (5.2), no aún en el navegador. `formatEuro` y `formatCompact` pasan a `@mudaro/validation`.

- Edge Function `client-order`: acción `get` devuelve también el orçamento vigente (sin coste ni margen, RNF-03); acciones nuevas `accept` y `reject`. La firma se sube al bucket desde la función.
- Página del enlace: si hay orçamento enviado, se muestra en lugar del inventario (o con una pestaña para ver el inventario anexo, RF-39).
- Extras opcionales con el total al momento (decisión 1), validez (RF-45), condiciones, inventario anexo.
- Aceptar con nombre y firma dibujada (RF-43) y confirmación. Rechazar con motivo opcional (RF-44).
- Estados: aceptado (resumen y fecha), rechazado, caducado y "a empresa está a preparar um orçamento novo" (superseded).
- Vista de impresión para "Guardar como PDF" (P4).

### 5.6 · Ganho y trabajo programado (RF-46) · hecho el 19/11/2026

Probado en el navegador con MD-0005 (trabajo el 20/12/2026 a las 09:00).

- La aceptación ya crea el trabajo (5.2). Aquí se muestra: Resumo del pedido con la tarjeta "Trabalho agendado" (fecha, hora y "Ver na agenda"); en la lista, la etapa "Ganhos" y "Ver trabalho", que lleva a ese Resumo (la ficha del trabajo es del paso 6).
- Agenda: `schedule.repo.ts` lee los trabajos reales (número del pedido, cliente, origen y destino de la versión del inventario del orçamento, operários y volumen) y los orçamentos enviados, y los suma a los de ejemplo. La hora de fin es el inicio más las horas estimadas del orçamento. Sin vehículo ni equipa, se distinguen de los de ejemplo por salir "por atribuir": la vista de día tiene una fila "Por atribuir" para ellos (antes no se veían). Conectarla del todo es el paso 6.

### 5.7 · Plan de pruebas

`docs/test-plan-quotes-5.md`, con el formato del 4a y el 4b: base de datos (restricciones, RLS, privacidad de coste y margen, versiones, superseded, caducidad, aceptación por enlace) y pantallas de la empresa y del cliente.

## Fuera del paso 5

- Asignar equipo y vehículo al trabajo, conflictos de agenda y ejecución (paso 6).
- Envío automático por WhatsApp, SMS o email (RF-16).
- Ajustes de objetos por empresa (RF-09, P1) y asistente de configuración (RF-08, P1).
- Límite de peticiones de `client-order` (anotado en `docs/plan-modelo-bd.md`, antes de enlaces a clientes reales).

## Orden y tamaño

| Sub-paso | Tamaño | Depende de |
| --- | --- | --- |
| 5.0 Renombrar | Pequeño, mecánico | Nada |
| 5.1 Tarifa y servicios | Medio | P1, P3 |
| 5.2 Base de datos | Grande | P5, P7, P9 |
| 5.3 Cálculo | Medio | 5.1, P2, P3, P10 |
| 5.4 Editor y lista | Grande | 5.2, 5.3, P1 |
| 5.5 Web del cliente | Grande | 5.2, P1, P4, P6 |
| 5.6 Ganho y trabajo | Pequeño | 5.5 |
| 5.7 Pruebas | Medio | Todo lo anterior |
