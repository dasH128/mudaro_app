# Mudaro

Software para empresas de mudanzas: de la llamada al presupuesto aceptado y a la mudanza documentada. Ahora mismo estamos en el MVP para transportistas y en el piloto con 5 a 10 empresas.

Fuentes de verdad (léelas antes de decidir algo de producto o de datos):
- `docs/requirement-mvp.md`: requisitos funcionales (RF-xx) y no funcionales (RNF-xx). Cita el ID cuando implementes uno.
- `docs/architecture-system.md`: decisiones técnicas ya tomadas. No las cambies sin preguntar.
- `docs/design.md`: colores, tipografías y logo.

@docs/architecture-system.md

## Estructura del monorepo

```
mudaro/                      ← un repo (pnpm workspaces + Turborepo)
  apps/
    landing/    → mudaro.pt          público, captación del piloto
    admin/      → admin.mudaro.pt    panel interno (solo tú y el equipo)
    cliente/    → enlace del cliente (más adelante)
    empresa/    → app.mudaro.pt      panel web del transportista (futuro)
  packages/
    ui/         → componentes y tokens de la identidad (colores, fuentes, logo)
    supabase/   → cliente, tipos generados del esquema, helpers de auth
    config/     → tsconfig, eslint, tailwind compartidos
```

Cada carpeta de `apps/` tiene su propio `CLAUDE.md` con las reglas de esa app. Léelo cuando trabajes dentro.

## Stack

- Next.js 16 con App Router. El antiguo `middleware.ts` ahora es `proxy.ts`.
- TypeScript en modo `strict`. Nada de `any` salvo justificación en un comentario.
- pnpm workspaces y Turborepo.
- Supabase: Postgres, Auth, Storage y Edge Functions (Deno).
- Estilos: usa lo mismo que ya usa `apps/landing`. No introduzcas otra librería de estilos o de componentes sin preguntar.

## Comandos

```
pnpm install
pnpm dev --filter=admin      # o --filter=landing
pnpm build                   # todas las apps con caché de Turborepo
pnpm lint && pnpm typecheck
pnpm db:types                # regenera packages/supabase/src/database.types.ts
```

Si alguno de estos scripts todavía no existe, créalo en el `package.json` raíz y en `turbo.json`.

## Seguridad (no negociable)

1. La `SUPABASE_SERVICE_ROLE_KEY` nunca va en una app de Next.js. Solo existe en las Edge Functions de `supabase/functions/`.
2. Los helpers que solo deben correr en servidor llevan `import "server-only"`.
3. La autorización no se hace solo en `proxy.ts`. El proxy puede redirigir a quien no tiene sesión, pero cada Server Action, Route Handler y página protegida vuelve a comprobar sesión y rol en el servidor, y RLS lo comprueba otra vez en la base de datos.
4. Todas las tablas con datos de empresa tienen RLS por `empresa_id` (RNF-01). Los usuarios del equipo Mudaro tienen un rol de plataforma aparte, con políticas propias.
5. Solo las variables que empiezan por `NEXT_PUBLIC_` llegan al navegador. Revisa que ninguna secreta tenga ese prefijo.
6. Nunca subas `.env*` al repositorio. Mantén un `.env.example` por app.

## Convenciones

- Interfaz en portugués de Portugal (RNF-10): euros, fechas `dd/mm/aaaa`, coma decimal.
- Tablas y columnas con los nombres del esquema SQL (en español). Código, variables y funciones en inglés.
- Tipos de base de datos siempre desde `packages/supabase`, nunca escritos a mano.
- Si un componente se usa en dos apps, muévelo a `packages/ui`.
- Validación de formularios en servidor con zod, aunque también se valide en cliente.

## Cómo trabajar conmigo

- Antes de cambios grandes, propón un plan con los archivos que vas a tocar y espera mi confirmación.
- Cambios pequeños y revisables. Un tema por commit.
- No cambies el comportamiento visible de `apps/landing` salvo que te lo pida.
- Si un requisito es ambiguo o choca con `docs/architecture-system.md`, pregunta en lugar de suponer.
- Al terminar, ejecuta `pnpm lint` y `pnpm typecheck` y dime el resultado.
