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
| Pedidos, Propostas, Agenda, Clientes, Frota, Equipa, Tarifas, Relatórios, Configurações, Trabalho, Incidência, Atividade | declaradas en `ROUTES` | Páginas pendientes: los enlaces dan 404 hasta crearlas |

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
    icon.tsx                ← <Icon name="…" />, iconos de trazo decorativos
    theme-toggle.tsx, language-switcher.tsx, theme-provider.tsx
  i18n/                     ← config, get-dictionary y dictionaries/{en,es,pt}.json
  lib/routes.ts             ← ROUTES y localePath()
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
- Interfaz en portugués de Portugal (RNF-10). Los textos de las pantallas nuevas deben ir a `i18n/dictionaries/` (`en.json` es la base de tipos; `es` y `pt` caen al inglés si falta una clave).
- Componentes de servidor por defecto. `"use client"` solo donde haya estado o eventos.
- Iconos: añade el path nuevo a `app/components/icon.tsx` en lugar de pegar SVG inline.
- Si un componente se usa también en otra app, muévelo a `packages/ui`.

## Estado actual y pendientes (29/10/2026)

- `app/[lang]/page.tsx` (plantilla de Next) eliminado; el inicio vive en `app/[lang]/(app)/page.tsx`.
- Se añadieron tokens `success-*`, `danger-dot`, `surface-soft`, `surface-head` y `sidebar` a `packages/ui/src/tokens.css`.
- Início solo tiene el diseño: datos de `features/dashboard/infrastructure/mock-data.ts`, empresa y usuario del menú fijos, textos en portugués sin pasar por i18n.
- El grupo `(app)` aún no comprueba sesión ni rol; hay que añadirlo antes de conectar datos reales.
- Pendiente: revisar el tema oscuro de la vista, y resolver rutas y estado activo del menú cuando existan más pantallas (hoy el activo es Início fijo).
- Pendiente: botones sin acción (Novo pedido, Rever incidência, notificações, menú de cuenta) y búsqueda sin conectar.
