# apps/company · Panel web del transportista

Solo lo usan las empresas registradas. Sirve para que las empresas del piloto gestionen su día a día: pedidos, propuestas, agenda, frota y equipo. Dominio previsto: app.mudaro.pt.

Prototipos de cada pantalla en `docs/design/company/<vista>`. Lee su `README.md` antes de implementar una vista.

## Pantallas del MVP

| Pantalla | Ruta | Estado |
| --- | --- | --- |
| Login | `/[lang]/login` | Hecha |
| Confirmar invitación | `/[lang]/auth/confirm` | Hecha |
| Definir contraseña | `/[lang]/auth/set-password` | Hecha |
| Início · Operações de hoje | `/[lang]` | Hecha solo el diseño, con datos de ejemplo |
| Propostas · Lista | `/[lang]/proposals` | Hecha con datos de ejemplo (RF-38, RF-42, RF-45). Filtros y orden en la URL |
| Novo pedido | `/[lang]/orders/new` | Hecha con datos de ejemplo (RF-13, RF-14, RF-19). Crea el pedido en un almacén en memoria |
| Pedido criado | `/[lang]/orders/[id]/created` | Hecha solo el diseño: el enlace con token **no se genera** (RF-15, RF-16, RNF-02) |
| Pedidos · Lista | `/[lang]/orders` | Hecha solo el diseño, con datos de ejemplo (RF-17). Etapa, vista, búsqueda y paginación en la URL |
| Inventário (empresa) | `/[lang]/orders/[id]/inventory` | Hecha solo el diseño (RF-19): el borrador vive en el navegador y no se guarda |
| Detalhe do pedido | `/[lang]/orders/[id]` | Hecha solo el diseño, con datos de ejemplo. Pestaña en la URL (`?tab=`) |
| Frota | `/[lang]/fleet` | Hecha solo el diseño, con datos de ejemplo (RF-05). Filtro, búsqueda, orden, vista y vehículo abierto en la URL. Sin ningún vehículo muestra el estado de primer uso (P7-1) |
| Novo veículo | `/[lang]/fleet/new` | Hecha con datos de ejemplo (RF-05). Crea el vehículo en un almacén en memoria |
| Equipa | `/[lang]/team` | Hecha solo el diseño, con datos de ejemplo. Filtro, búsqueda, orden, vista y persona abierta en la URL. Sin ninguna persona muestra el estado de primer uso (P8-1) |
| Agenda, Clientes, Tarifas, Relatórios, Configurações, Trabalho, Incidência, Atividade, editor y detalle de propuesta | declaradas en `ROUTES` | Páginas pendientes: los enlaces dan 404 hasta crearlas |

## Estructura del código

Organizada por feature. Dentro de cada feature hay cuatro capas: `domain`, `application`, `infrastructure` y `presentation`. `app/` solo contiene rutas; todo lo demás de una feature vive en `features/<feature>/`.

> Esta arquitectura en capas se usa solo en `apps/company`. `apps/admin` y `apps/landing` siguen su propia estructura.

```
app/
  [lang]/
    layout.tsx              ← html, fuentes y ThemeProvider
    (auth)/                 ← login, auth/confirm, auth/set-password (layout con panel de marca)
    (app)/                  ← zona autenticada
      layout.tsx            ← menú lateral + <main>
      page.tsx              ← Início (Operações de hoje)
  components/               ← compartidos por varias vistas de esta app
    app-sidebar.tsx         ← menú lateral (en móvil pasa a barra superior)
    app-icon.tsx            ← <Icon name="…" />, iconos de trazo decorativos (no se llama icon.tsx: Next lo reserva para el icono de la app)
    app-nav.tsx             ← enlaces del menú (cliente: lee la ruta para marcar el activo)
    form/                   ← campos compartidos: field.tsx (etiqueta, ayuda, error) y choice-group.tsx (radios en chips o segmentos)
    first-use.tsx           ← estructura del estado de primer uso de una lista (Frota, Equipa): cabecera, invitación, ventajas y pie
    panel-escape.tsx        ← cierra un panel lateral con Escape (Frota y Equipa)
    theme-toggle.tsx, language-switcher.tsx, theme-provider.tsx
  i18n/                     ← config, get-dictionary, interpolate (textos con {valores} y plurales) y dictionaries/{en,es,pt}.json
  lib/
    routes.ts               ← ROUTES y localePath()
    format.ts               ← euros, fechas, números y hora de Lisboa (RNF-10)
    mock-session.ts         ← empresa y usuario de ejemplo (saldrán de la sesión)
features/
  auth/
    application/
      actions/              ← Server Actions: confirm-invitation, set-password (+ state.ts)
      schemas/              ← zod de invitación y contraseña
    infrastructure/
      auth.repo.ts          ← único acceso a Supabase Auth
  dashboard/
    domain/
      types.ts              ← entidades: Job, Stat, Stage, ActivityItem, Dashboard
    infrastructure/
      dashboard.repo.ts     ← puerta de entrada: getDashboard()
      mock-data.ts          ← datos de ejemplo (sustituir por consultas a Supabase)
    presentation/
      components/           ← dashboard-header, stat-cards, attention-banner,
                              jobs-table, pipeline, side-panels
  orders/
    domain/
      types.ts              ← NewOrder, Order, ClientSuggestion y las listas de opciones (flexibilidad, origen, modo de inventario)
      client-name.ts        ← primer nombre e iniciales
      detail.ts             ← detalle (P6): OrderDetail, percurso (buildJourney), totales del inventario, estado del enlace (linkState) y pestañas
      list.ts               ← lista: filtros, orden, contadores, "Precisam de ti" (needsAttention), siguiente paso y paginación
    application/
      actions/              ← create-order, lookup-client (+ state.ts)
      schemas/new-order.ts  ← zod en servidor; los errores son códigos que traduce el formulario
    infrastructure/
      orders.repo.ts        ← puerta de entrada: createOrder, getOrder, getOrderDetail, findClientByPhone
      store.ts, mock-data.ts, detail-mock-data.ts ← almacén en memoria y datos de ejemplo
    presentation/
      orders-text.ts        ← textos de la lista (describeNote, describeWhen) y mensaje al cliente
      orders-href.ts        ← enlaces de la lista con filtros en la URL, destino de cada siguiente paso y orderDetailHref (pestaña en la URL)
      detail-text.ts        ← accesos en chips y datos, y título/detalle de cada evento del historial (P6)
      components/           ← new-order-form (único cliente grande), client/move/inventory-section, order-side-panels,
                              share-link-card, order-status-timeline, order-breadcrumb; lista: orders-list-header,
                              orders-welcome, orders-pipeline, orders-view-bar, urgent-orders, orders-cards-list,
                              orders-table, orders-side-panels (+ order-action, order-avatar, order-stage-pill, order-steps);
                              detalle: order-detail-header, order-journey, order-measure-alert, order-detail-tabs,
                              order-summary-tab, order-inventory-tab, order-addresses-tab, order-proposals-tab,
                              order-history-tab, order-detail-side (cliente, enlace y notas), order-detail-parts
  fleet/
    domain/
      types.ts              ← Vehicle, VehicleJob, VehicleEvent, LiveStatus (importes en céntimos, fechas aaaa-mm-dd)
      fleet.ts              ← filtros, orden, "parado" (IDLE_DAYS), próximo trabajo, resumen y avisos de la frota
      new-vehicle.ts        ← alta: tipos, valores habituales por tipo (VehiclePreset), límites, NewVehicle, FleetSnapshot y parseDecimal
      plate.ts              ← matrículas de Portugal: normalizePlate (AA-00-AA) y compactPlate
    application/
      actions/              ← create-vehicle (+ state.ts)
      schemas/new-vehicle.ts ← zod en servidor; los errores son códigos que traduce el formulario
    infrastructure/
      fleet.repo.ts         ← puerta de entrada: getFleetOverview({ today, includeCost }) y createVehicle
      store.ts              ← vehículos creados, en memoria
      mock-data.ts          ← 6 vehículos de ejemplo con fechas relativas a hoy
    presentation/
      fleet-href.ts         ← enlaces con filtro, orden, vista y vehículo en la URL
      fleet-text.ts         ← estado, último/próximo uso y histórico → textos del diccionario
      components/           ← fleet-header (+ capacity-pill, único cliente con la ayuda), fleet-alerts, fleet-toolbar,
                              fleet-table, fleet-cards, vehicle-panel, fleet-empty (+ fleet-empty-art), fleet-parts;
                              alta: new-vehicle-form (único cliente grande), vehicle-type-section, vehicle-details-sections
                              (identificación, capacidad y costes, disponibilidad, próximamente) y new-vehicle-aside (índice y previsualización)
  team/
    domain/
      types.ts              ← Member, Invite, Person, Admin, TeamEvent (fechas aaaa-mm-dd, horas hh:mm, teléfono +351…)
      team.ts               ← filtros, orden, "parado" (IDLE_DAYS), convite urgente, resumen y avisos del equipo
    infrastructure/
      team.repo.ts          ← puerta de entrada: getTeamOverview({ today })
      mock-data.ts          ← 7 operarios activos, 1 inactivo, 2 convites y 2 administradores, con fechas relativas a hoy
    presentation/
      team-href.ts          ← enlaces con filtro, orden, vista y persona en la URL
      team-text.ts          ← estado, último/próximo trabajo, acceso, caducidad y histórico → textos del diccionario
      components/           ← team-header (+ team-help, único cliente con la ayuda), team-alerts, team-toolbar,
                              team-table, team-cards, team-admins, person-panel, team-empty (+ team-empty-art), team-parts
  inventory/
    domain/
      types.ts              ← CatalogItem, AccessPoint, ExtraService, pasos y divisiones; summarize() (totales) y normalizeSearch()
    infrastructure/
      inventory.repo.ts     ← puerta de entrada: getCatalog, getActiveExtras
      mock-data.ts          ← catálogo y extras de ejemplo
    presentation/
      components/           ← inventory-editor (único cliente), header, steps, rooms-nav, catalog-grid,
                              inventory-summary, access-form, extras-step, inventory-footer
  proposals/
    domain/
      types.ts              ← Proposal, ReadyRequest, ProposalMetrics (importes en céntimos, fechas ISO)
      status.ts             ← applyExpiry (RF-45) y deriveValidity
      filters.ts            ← filtro por estado y texto, orden, contadores y resumen
    infrastructure/
      proposals.repo.ts     ← puerta de entrada: getProposalsOverview({ includeMargin })
      mock-data.ts          ← 18 propuestas de ejemplo con fechas relativas a hoy
    presentation/
      proposals-text.ts     ← pasa los códigos del dominio a los textos del diccionario
      proposals-href.ts     ← enlaces con filtros en la URL
      components/           ← header, stats, ready-requests, toolbar (usa `app/components/form/sort-select.tsx`),
                              table, status-pill
```

Una feature no necesita tener las cuatro capas: se crea solo la que hace falta (`auth` no tiene `domain` ni `presentation` porque sus formularios viven junto a su ruta).

Los `page.tsx` se quedan en `app/` porque Next.js enruta por carpetas. Cada uno pide los datos al repo de la feature (`infrastructure/<feature>.repo.ts`) y compone los componentes de `presentation/`.

### Qué va en cada capa

| Capa | Contiene | Sabe de |
| --- | --- | --- |
| `domain/` | Entidades, tipos y reglas de negocio | Nada externo |
| `application/` | Casos de uso: Server Actions y schemas zod de entrada | `domain/` e `infrastructure/` |
| `infrastructure/` | Supabase, Edge Functions, mapeo de filas a entidades, datos de ejemplo | `domain/` y librerías externas |
| `presentation/` | Componentes de UI de la feature | `domain/` (solo tipos) |

### Reglas de dependencias (en un solo sentido)

`app/` (rutas) → `presentation` → `application` → `infrastructure` → `domain`

- `domain/` no importa React, Next, `server-only`, `@/app/*` ni Supabase. Es lógica pura y testeable.
- `infrastructure/` es el único sitio que importa `@mudaro/supabase/*`. Cada fichero que accede a datos lleva `import "server-only"`.
- Los tipos de la base de datos (`packages/supabase`) solo se usan en `infrastructure/`, para convertirlos a los tipos de `domain/types.ts`. El resto de la app usa tipos de dominio.
- Los componentes de `presentation/` no importan `infrastructure/` ni `@supabase/*`. Reciben los datos por props desde la página, o llaman a una Server Action de `application/`.
- Las lecturas van de la página al repo (`infrastructure/*.repo.ts`) sin caso de uso intermedio. Solo las mutaciones pasan por `application/actions/`.
- Una Server Action hace siempre: comprobar sesión y rol, validar con zod (`application/schemas/`) y llamar al repo o a una Edge Function. Los archivos con `"use server"` solo exportan funciones async; los helpers y tipos van en archivos aparte (`state.ts`).
- Los imports entre capas usan el alias `@/features/...`. Dentro de una misma carpeta se usan imports relativos.
- Una feature nueva sigue la misma estructura en `features/<nombre>/`. Lo que necesite otra app sube a `packages/` solo cuando exista esa segunda app.

## Reglas

- Estilos con Tailwind v4 y los tokens de `packages/ui/src/tokens.css` (`bg-surface`, `border-line`, `text-muted`, `bg-warn-surface`, `bg-success-surface`, `bg-sidebar`, etc.). No pongas colores hex en componentes: si falta un color, añade un token en `tokens.css` con su valor para `[data-theme="dark"]`.
- El logo sale siempre de `MudaroSymbol` (`@mudaro/ui`). Sobre fondo tinta usa `variant="light"`.
- Toda ruta se declara en `app/lib/routes.ts` y se usa siempre con `localePath(lang, ROUTES.x)`: en `href`, `redirect`, selector de idioma, etc. Nada de strings sueltos ni `href="#"`. Las rutas con parámetro son funciones (`ROUTES.jobs.detail(id)`). Las rutas nuevas van en inglés. Las rutas de `(app)` se añaden ahí y se protegen en servidor (sesión y rol en cada página y acción, además de RLS).
- Interfaz en portugués de Portugal (RNF-10). Todos los textos van a `i18n/dictionaries/` en los tres idiomas (`en.json` es la base de tipos; `es` y `pt` caen al inglés si falta una clave). Los códigos del dominio (`sent`, `expiring`) se traducen en `presentation/`; los textos con valores usan `interpolate()` y los singulares/plurales `pluralize()`. Los datos de la empresa (nombres, rutas, motivos) no se traducen.
- Reglas de datos de Portugal (NIF, teléfono, fecha `dd/mm/aaaa`) de `@mudaro/validation`, el paquete compartido con `apps/admin`. No las copies aquí: si falta una, se añade al paquete.
- Formularios con estado (como Novo pedido): validación **siempre en servidor** con zod. Los mensajes de error son **códigos** (`phoneInvalid`) y el formulario los traduce con el diccionario. Los campos son controlados, el envío es una Server Action con `useActionState`, y cada campo lleva `aria-invalid` y `aria-describedby` hacia su error.
- Euros, fechas `dd/mm/aaaa`, coma decimal y hora de Lisboa siempre con `app/lib/format.ts`, sea cual sea el idioma de la interfaz. El dominio guarda céntimos y fechas ISO, nunca texto formateado.
- `cacheComponents` está activo: lo que dependa de la hora actual (`new Date()`) va después de `await connection()` (o de otro acceso dinámico) y las páginas dinámicas llevan `loading.tsx`.
- Filtros, búsqueda y orden de las listas viajan en la URL (formulario GET con `next/form` y enlaces), no en estado de cliente. El cliente solo se usa para lo mínimo (p. ej. enviar el formulario al cambiar un `<select>`).
- Precios privados (RNF-03): el margen solo lo devuelve el repo si `includeMargin` es `true`; con `false` ni sale de `infrastructure/`.
- Componentes de servidor por defecto. `"use client"` solo donde haya estado o eventos.
- Iconos: añade el path nuevo a `app/components/app-icon.tsx` en lugar de pegar SVG inline. No llames `icon.tsx`, `apple-icon.tsx` ni `favicon.*` a ningún fichero de `app/` que no sea el icono de la app: son nombres reservados de Next.
- Si un componente se usa también en otra app, muévelo a `packages/ui`.

## Estado actual y pendientes (29/10/2026)

- `app/[lang]/page.tsx` (plantilla de Next) eliminado; el inicio vive en `app/[lang]/(app)/page.tsx`.
- Se añadieron tokens `success-*`, `danger-dot`, `surface-soft`, `surface-head` y `sidebar` a `packages/ui/src/tokens.css`.
- Início solo tiene el diseño: datos de `features/dashboard/infrastructure/mock-data.ts`, empresa y usuario del menú fijos, textos en portugués sin pasar por i18n.
- El grupo `(app)` aún no comprueba sesión ni rol; hay que añadirlo antes de conectar datos reales.
- Pendiente: revisar el tema oscuro de las vistas.
- El menú lateral ya está traducido y marca el enlace activo según la ruta. La empresa y el usuario siguen siendo de ejemplo.
- Propostas · Lista (29/10/2026): datos de `features/proposals/infrastructure/mock-data.ts`. "Nova proposta", "Criar proposta" (`/proposals/new?request=<id>`) y el enlace de cada fila (`/proposals/<id>`) dan 404 hasta crear el editor y el detalle. Los filtros del diseño P1 se resolvieron en servidor. Las versiones de una propuesta comparten número, y el enlace de una versión sustituida lleva a la misma ruta de detalle (pendiente decidir cómo elegir versión). El margen se muestra siempre (`CAN_SEE_MARGIN = true` en `proposals/page.tsx`) hasta que exista el rol; después solo administradores. Los umbrales de "a punto de caducar" (3 días, `EXPIRING_SOON_DAYS`) y la ordenación por defecto son provisionales.
- **Pendiente (decidido el 29/10/2026): generar el enlace del pedido.** Hoy "Copiar link", WhatsApp, SMS y Email están desactivados y el enlace muestra `[LINK DO PEDIDO]`. Falta la Edge Function que cree la solicitud y el token de al menos 32 bytes con caducidad, guardando solo su hash (RF-15, RNF-02: la clave de servicio solo vive en las Edge Functions), las tablas de solicitudes y clientes (paso 4 del plan de BD) y el envío por cada canal (RF-16). El pedido pasa a "À espera de inventário" al copiar o enviar el enlace; hoy se queda en "Nova".
- Novo pedido (29/10/2026): los pedidos se guardan en `features/orders/infrastructure/store.ts`, en memoria (se pierden al reiniciar). El teléfono `912 345 821` sugiere a Ana Ribeiro y `916 667 777` a Rui Fonseca (RF-14). El máximo de paradas (3) y la validez del enlace (7, 14 o 30 días) son provisionales. "Editar modelo" del mensaje está desactivado: no tiene diseño de flujo. `lookupClientAction` y `createOrderAction` aún no comprueban sesión ni rol (son endpoints públicos): hay que añadirlo con el login de empresa, y limitar la frecuencia de la búsqueda por teléfono. Si el inventario lo rellena la empresa, se redirige a `/orders/<id>/inventory` (Inventário, ya hecha). El mensaje al cliente se redacta en el idioma de la interfaz de la empresa, no en el del cliente.
- Pendiente: botones sin acción (Novo pedido, Rever incidência, notificações, menú de cuenta) y búsqueda sin conectar.
- Pedidos · Lista (29/10/2026, solo diseño): datos de `features/orders/infrastructure/mock-data.ts` (24 pedidos, 1 · 5 · 3 · 3 · 10 · 2 por etapa) más los creados en `store.ts`. Filtros por URL: `?stage=` (una etapa o `action`), `?view=cards|list`, `?q=`, `?limit=` ("Ver mais" en cartões) y `?page=` (tabla). El prototipo muestra fechas como "18 nov"; aquí van `dd/mm/aaaa` (RNF-10). La búsqueda solo cubre nombre y nº de pedido (el prototipo decía también teléfono, que la lista no tiene). El número de pedido (MD-0835) enlaza al detalle y la fila entera es clicable (`order-id-link.tsx`, enlace estirado; los botones de acción quedan por encima); "Reenviar link", "Copiar link", "Ver trabalho" y el menú "Mais ações" salen desactivados; "Partilhar link" lleva a `/orders/<id>/created`, que solo existe para pedidos del almacén en memoria. La etiqueta "Pedidos 5" del menú sigue fija.
- **Pendiente de revisar: el estado "Perdido".** El diseño lo tiene como etapa, pero `ORDER_STATUSES` no. Provisionalmente `ORDER_STAGES = [...ORDER_STATUSES, "lost"]` en `orders/domain/types.ts`. Hay que decidir si pasa a ser un estado real del pedido (afecta a `order-status-timeline.tsx`, al modelo de datos y al motivo de pérdida).
- Inventário (empresa) (30/10/2026, solo diseño): `features/inventory`. Cantidades, accesos y extras viven en estado de cliente y se pierden al salir; no hay Server Action ni validación zod todavía (los asteriscos de Andar, Estacionamento y Elevador son solo visuales). "Guardar e sair" y "Concluir inventário" llevan a `/orders/<id>` (Detalhe do pedido), y el pedido no cambia de estado. No se muestra "Guardado automaticamente" porque no se guarda. "Adicionar divisão", "Não está na lista?" y "Juntar fotos" salen desactivados (sin diseño de flujo). La búsqueda del catálogo filtra en cliente, solo dentro de la división actual. Los pedidos de ejemplo de la lista no abren esta pantalla: `getOrder` solo conoce los del almacén en memoria.
- Detalhe do pedido (30/10/2026, solo diseño): `/orders/[id]` con datos de `features/orders/infrastructure/detail-mock-data.ts`. Solo MD-0835 (Sofia Costa) tiene inventario, accesos, notas y teléfono; el resto de pedidos de la lista se construye desde su fila y muestra "Ainda não há inventário"; los creados en esta sesión solo traen lo del formulario. Las pestañas viajan en `?tab=` (resumo, inventory, addresses, proposals, history). El diseño muestra la fecha como "20 nov"; aquí va `dd/mm/aaaa` (RNF-10). Desactivados por falta de flujo o de enlace: "Mais ações", "Editar" (mudança), "Estimar eu", "Pedir ao cliente", "Ver ficha", "Copiar link" y "Ver como cliente". "Notas internas" se ve pero no se puede editar ni guardar. "Criar proposta" lleva a `/proposals/new?request=<id>` (404 hasta crear el editor). El aviso de medidas solo sale en "Inventário recebido". El umbral de estacionamiento lejano (50 m, `FAR_PARKING_METERS`) es provisional. El enlace del cliente se calcula desde `validUntil` y `validityDays`, pero el token sigue sin generarse (ver pendiente del enlace). Los textos "criado por/ação de" usan "Gema" fijo en los datos de ejemplo.
- **Pendiente (decidido el 30/10/2026): menú "Mais ações" de los pedidos.** Sale desactivado en la lista y en el detalle porque el diseño no define su contenido. Se decide al terminar todos los diseños, cuando existan el enlace con token, el editor de propuestas y el estado "Perdido". Propuesta guardada, con las opciones según la etapa:
  - Siempre: editar pedido (mudança y cliente), añadir nota interna, ver detalhe.
  - Con enlace activo ("À espera de inventário" e "Inventário recebido"): copiar, reenviar, renovar la validez y desactivar el enlace.
  - Con inventario recibido: editar inventário y criar proposta.
  - Con proposta enviada: ver proposta y marcar como perdido, con motivo.
  - Al final, separado y en rojo: cancelar o arquivar el pedido.
- **Pendiente (decidido el 30/10/2026): pantallas de error y "no encontrado".** Hoy un pedido que no existe muestra la página 404 genérica de Next.js, en inglés, sin diseño. No hay `not-found.tsx` ni `error.tsx` en `app/`, y los prototipos no las incluyen: hay que diseñarlas. Propuesta, sin una pantalla por caso:
  - "No existe o no tienes acceso" (pedido, propuesta, cliente...): un componente compartido y un `not-found.tsx` por zona con su texto ("Pedido não encontrado"...) y un botón para volver a la lista. Un recurso de otra empresa muestra lo mismo que uno inexistente, para no revelar que existe.
  - Fallo inesperado: un único `error.tsx` en `(app)` con "Tentar novamente".
  - No son error: sin sesión redirige a `/login`, y un pedido sin inventario es un estado vacío dentro de la pantalla (ya lo hace la pestaña Inventário).
- **Pendiente: una sola fuente de datos para los pedidos.** `/orders/[id]/inventory` y `/orders/[id]/created` usan `getOrder` (solo los pedidos creados en esta sesión), mientras que la lista y el detalle también leen los 24 de ejemplo. Por eso "Preencher inventário" desde el detalle de un pedido de ejemplo (p. ej. MD-0828) da 404, y los pedidos creados traen menos datos que los de ejemplo. Se resuelve al pasar a Supabase (una sola tabla) o, antes, haciendo que esas dos páginas lean igual que el detalle.
- Frota (30/10/2026, solo diseño): `/fleet` con datos de `features/fleet/infrastructure/mock-data.ts` (5 activos y 1 inactivo, fechas relativas a hoy). Todo viaja en la URL: `?filter=` (all, free, busy, idle), `?q=`, `?sort=`, `?view=list|cards` y `?vehicle=<id>` (panel lateral, con anterior/siguiente y Esc para cerrar). Con el panel abierto la tabla oculta "Último uso" y "Próximo uso"; un vehículo que el filtro excluye sigue abriéndose y se añade al final de la navegación. Desactivados por falta de flujo o de datos: "Adicionar veículo", el interruptor Ativo/Inativo, los campos de "Dados do veículo" (solo lectura, sin guardar ni zod), "Ver na agenda" y "Abrir agenda" (la agenda no existe). El coste por km solo sale del repo con `includeCost` (RNF-03): `CAN_SEE_COST = true` en `fleet/page.tsx` hasta que exista el rol, y sin él se oculta el campo, el aviso de "sem custo" y el histórico de cambios de coste. "Parado" (14 días, `IDLE_DAYS`) es provisional. El estado "Na estrada / Livre" y los trabajos de hoy son datos fijos de ejemplo, no se calculan. Los trabajos del panel muestran cliente y nº de pedido como texto: los pedidos de ejemplo de la lista no coinciden con esos números. Movido `sort-select.tsx` de proposals a `app/components/form/` para compartirlo.
- Layout de `(app)` (31/10/2026): la cookie del menú plegado se lee en un componente `Shell` bajo `<Suspense fallback={null}>` para evitar el aviso `blocking-prerender-runtime` de cacheComponents. Sin avisos en Início, Pedidos, Propostas, Novo pedido, Frota y Equipa.
- Equipa (31/10/2026, solo diseño): `/team` con datos de `features/team/infrastructure/mock-data.ts`. Todo viaja en la URL: `?filter=` (all, busy, free, invites), `?q=` (nombre, email o teléfono), `?sort=`, `?view=list|cards` y `?person=<id>` (panel lateral, con anterior/siguiente y Esc). Con el panel abierto la tabla oculta "Último trabalho" y "Próximo trabalho". Desactivados por falta de flujo o de datos: "Convidar pessoa", "Reenviar convite", "Copiar link", "Gerar link novo" y "Cancelar convite" (el enlace del convite sale como `[LINK DO CONVITE]`, como el del pedido), el interruptor Ativo/Inativo, "Enviar link de acesso", "Mudar papel", "Atribuir na agenda", "Ver na agenda" y "Abrir agenda" (la agenda no existe). Los campos de "Dados e acesso" son de solo lectura (sin guardar ni zod; el diseño decía "Guarda ao sair do campo"). La función (Motorista, Carregador, Chefe de equipa) es un código del dominio; el diseño la mostraba como texto libre ("Chefe de equipa · motorista"), aquí solo el nombre de la función. El aviso de personal sale de `TeamMetrics.understaffed` (dato de ejemplo): faltan personas si las asignadas al pedido son menos que `needed`. "Parado" (14 días, `IDLE_DAYS`) y el convite "urgente" (caduca en 1 día o menos, `INVITE_URGENT_DAYS`) son provisionales. Los textos con pronombre del diseño ("falar com ele") se cambiaron por "falar com a pessoa". Teléfonos y emails de ejemplo inventados. Los administradores salen solo en lectura. La lista no comprueba rol: cuando exista, solo los administradores gestionan el equipo. Movido `panel-escape.tsx` de fleet a `app/components/` para compartirlo, y `team/domain` importa `addDays` y `daysBetween` de `fleet/domain/fleet.ts` (pendiente subirlos a un módulo común si una tercera feature los necesita).
- Equipa · Primeiro uso (31/10/2026, solo diseño): cuando `people` está vacío (ni operarios ni convites), `/team` muestra `team-empty.tsx` en lugar de la lista. Es el mismo `page.tsx`, no una ruta aparte. Para verlo con los datos de ejemplo, `/team?empty=1` (opción provisional `empty` de `getTeamOverview`; desaparece con Supabase). "Convidar o primeiro operário" sale desactivado (sin flujo). La ilustración usa tokens (`fill-primary`, `fill-foreground`…) y no hex, para que siga el tema oscuro (sin revisar). El diseño decía "administradora · tu" y "Trabalhas sozinho": se cambió a "administração · tu" y "Trabalhas sem equipa" por no suponer género. "0 operários" es una cadena fija porque `Intl.PluralRules` en portugués trata el 0 como singular.
- **Pendiente de revisar: layout en móvil.** Con una página corta, el grid de `sidebar-shell.tsx` reparte el espacio sobrante entre sus filas y el menú superior queda con un hueco azul (se ve en el estado vacío de Equipa a 600 px de ancho). Además, a ese ancho el contenido se sale por la derecha también en Frota. No es de una vista concreta.
- Frota · Primeiro uso (31/10/2026, solo diseño): cuando `vehicles` está vacío (ni activos ni inactivos), `/fleet` muestra `fleet-empty.tsx` en lugar de la lista; mismo `page.tsx`. Para verlo con los datos de ejemplo, `/fleet?empty=1` (opción provisional `empty` de `getFleetOverview`). La estructura es `app/components/first-use.tsx`, compartida con Equipa vacía (que se adaptó a ella); cada feature aporta sus textos, iconos e ilustración. "Adicionar o primeiro veículo" sale desactivado (sin flujo). El pie "Configuração da empresa · Passo 3 de 4" es una insignia sin enlace y desactivada: el asistente de configuración no existe, y el paso (3 de 4) está fijo en `fleet-empty.tsx`. La ilustración del camión usa tokens y capas translúcidas para el sombreado, no hex (tema oscuro sin revisar).
- Novo veículo (31/10/2026): `/fleet/new` (RF-05), con `ROUTES.fleet.new` (`ROUTES.fleet` pasó a ser `{ list, new }`). Los botones "Adicionar veículo" de la cabecera y del estado vacío ya enlazan aquí. El formulario es de Server Action con `useActionState` y zod en servidor (`create-vehicle.ts`, `schemas/new-vehicle.ts`); los campos son controlados. Los vehículos se guardan en `fleet/infrastructure/store.ts`, en memoria (se pierden al reiniciar), y `getFleetOverview` los suma a los de ejemplo. Obligatorios: matrícula, capacidad y coste por km (como marca el diseño); la carga máxima y el nombre son opcionales (sin nombre se usa la matrícula). Al elegir un tipo se sugieren nombre, capacidad, carga y coste (`VEHICLE_PRESETS`, valores provisionales); la etiqueta "Valor sugerido" desaparece al editar el campo. La matrícula se normaliza a `AA-00-AA` (dos letras o dos cifras por par, mezclando ambas) y es única en la frota: se avisa en vivo con la lista actual y el servidor lo vuelve a comprobar. Límites provisionales (`LIMITS`): 200 m³, 40 000 kg, 20 €/km y 60 caracteres. "Adicionar à frota" vuelve a la lista con el vehículo abierto (`?vehicle=`); "Adicionar e criar outro" vuelve al formulario con un aviso (`?added=<id>`, solo se muestra si el id existe). Un vehículo nuevo se da de alta como libre y sin salidas: por eso `lastUseOn` y `maxLoadKg` pueden ser `null` (la lista muestra "—" y "ainda sem trabalhos"), y un inactivo nace con motivo "Inativo". El borrador es real: `new-vehicle-draft.ts` guarda el formulario en `localStorage` con cada cambio (solo en ese navegador, todo en try/catch) y lo recupera al volver; se borra al enviar o al pulsar Cancelar. El aviso "Rascunho guardado automaticamente" solo sale si el navegador deja guardar. Pendiente: sesión y rol en la página y la acción (solo administradores, RNF-03). El diseño decía "Mudanças até 12 m³ podem ir só neste veículo": la cifra sale de la capacidad escrita. Las secciones Documentos, Fotos y Manutenção salen como "Em breve" (sin diseño).
- Tokens (31/10/2026): en `packages/ui/src/tokens.css`, `--line` del tema oscuro pasó de `#3A4070` a `#4A5185`. Con el anterior, los bordes de tarjetas y tablas casi no se distinguían de la superficie `#252A4E`. Afecta a todas las vistas de la app. Los `id` de las secciones del formulario de Novo veículo llevan prefijo `section-` para no chocar con los de los campos (`capacity`).
- Comprobación de vistas (31/10/2026): para ver una pantalla en oscuro o con interacción no basta `--screenshot` de Chrome (`--blink-settings` no cambia el tema). Se usó el protocolo de depuración (`--remote-debugging-port`) con `Emulation.setEmulatedMedia` (`prefers-color-scheme: dark`) y `Runtime.evaluate` para escribir en los campos y pulsar el envío.
