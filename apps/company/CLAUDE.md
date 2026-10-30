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
| Agenda, Clientes, Frota, Equipa, Tarifas, Relatórios, Configurações, Trabalho, Incidência, Atividade, detalle e inventario de un pedido, editor y detalle de propuesta | declaradas en `ROUTES` | Páginas pendientes: los enlaces dan 404 hasta crearlas |

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
      list.ts               ← lista: filtros, orden, contadores, "Precisam de ti" (needsAttention), siguiente paso y paginación
    application/
      actions/              ← create-order, lookup-client (+ state.ts)
      schemas/new-order.ts  ← zod en servidor; los errores son códigos que traduce el formulario
    infrastructure/
      orders.repo.ts        ← puerta de entrada: createOrder, getOrder, findClientByPhone
      store.ts, mock-data.ts ← almacén en memoria y clientes de ejemplo
    presentation/
      orders-text.ts        ← textos de la lista (describeNote, describeWhen) y mensaje al cliente
      orders-href.ts        ← enlaces de la lista con filtros en la URL y destino de cada siguiente paso
      components/           ← new-order-form (único cliente grande), client/move/inventory-section, order-side-panels,
                              share-link-card, order-status-timeline, order-breadcrumb; lista: orders-list-header,
                              orders-welcome, orders-pipeline, orders-view-bar, urgent-orders, orders-cards-list,
                              orders-table, orders-side-panels (+ order-action, order-avatar, order-stage-pill, order-steps)
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
      components/           ← header, stats, ready-requests, toolbar (+ sort-select, único cliente),
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
- Novo pedido (29/10/2026): los pedidos se guardan en `features/orders/infrastructure/store.ts`, en memoria (se pierden al reiniciar). El teléfono `912 345 821` sugiere a Ana Ribeiro y `916 667 777` a Rui Fonseca (RF-14). El máximo de paradas (3) y la validez del enlace (7, 14 o 30 días) son provisionales. "Editar modelo" del mensaje está desactivado: no tiene diseño de flujo. `lookupClientAction` y `createOrderAction` aún no comprueban sesión ni rol (son endpoints públicos): hay que añadirlo con el login de empresa, y limitar la frecuencia de la búsqueda por teléfono. Si el inventario lo rellena la empresa, se redirige a `/orders/<id>/inventory`, que da 404 hasta crear esa pantalla. El mensaje al cliente se redacta en el idioma de la interfaz de la empresa, no en el del cliente.
- Pendiente: botones sin acción (Novo pedido, Rever incidência, notificações, menú de cuenta) y búsqueda sin conectar.
- Pedidos · Lista (29/10/2026, solo diseño): datos de `features/orders/infrastructure/mock-data.ts` (24 pedidos, 1 · 5 · 3 · 3 · 10 · 2 por etapa) más los creados en `store.ts`. Filtros por URL: `?stage=` (una etapa o `action`), `?view=cards|list`, `?q=`, `?limit=` ("Ver mais" en cartões) y `?page=` (tabla). El prototipo muestra fechas como "18 nov"; aquí van `dd/mm/aaaa` (RNF-10). La búsqueda solo cubre nombre y nº de pedido (el prototipo decía también teléfono, que la lista no tiene). "Reenviar link", "Copiar link", "Ver trabalho" y el menú "Mais ações" salen desactivados; "Partilhar link" lleva a `/orders/<id>/created`, que solo existe para pedidos del almacén en memoria. La etiqueta "Pedidos 5" del menú sigue fija.
- **Pendiente de revisar: el estado "Perdido".** El diseño lo tiene como etapa, pero `ORDER_STATUSES` no. Provisionalmente `ORDER_STAGES = [...ORDER_STATUSES, "lost"]` en `orders/domain/types.ts`. Hay que decidir si pasa a ser un estado real del pedido (afecta a `order-status-timeline.tsx`, al modelo de datos y al motivo de pérdida).
