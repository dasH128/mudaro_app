# apps/admin · Panel interno Mudaro

Solo lo usa el equipo Mudaro. Sirve para dar de alta las empresas del piloto, mantener el catálogo global de objetos y dar soporte.

## Pantallas del MVP

| Ruta | Pantalla | Requisito | Notas |
| --- | --- | --- | --- |
| `/login` | Entrar | | Email y contraseña de Supabase Auth, con MFA |
| `/empresas` | Lista de empresas | RF-66 | Búsqueda y filtro por estado (en la URL): convite pendente, em configuração, ativa, desativada |
| `/empresas/nueva` | Nova empresa | RF-65 | Datos de empresa, administrador y piloto. Llamará a la Edge Function `crear-empresa` |
| `/empresas/[id]` | Detalhe da empresa | RF-67, RF-68 | Convite (copiar, reenviar, enlace nuevo), utilizadores, configuración, IMT y RGPD, datos, histórico. Desactivar y reactivar con diálogo |

Referencia visual: `docs/design/admin/` (P0 a P3). Las reglas de validación y de estado están en `docs/requirement-mvp.md`, sección M13.

## Estructura del código

Organizada por feature, con capas ligeras dentro de cada una. `app/` solo contiene rutas; todo lo demás de una feature vive en `features/<feature>/`.

```
apps/admin/
  app/                      # routing: page.tsx, layout.tsx, login. Los page.tsx componen, no contienen lógica de negocio
    components/             # UI genérica de la app (ui/, form/, back-link, page-title...)
    lib/                    # transversal: auth, routes, format
  features/
    empresas/
      domain/               # TypeScript puro: estado.ts, nif.ts, regioes.ts, types.ts, filtros.ts
      data/                 # único acceso a datos: empresas.repo.ts (puerta de entrada), store.ts y mock.ts (simulación)
      schemas/              # zod de los formularios (nueva-empresa.ts)
      actions/              # Server Actions: crear-empresa, cambiar-estado, convite (+ state.ts, revalidar-empresa.ts)
      components/           # UI de la feature: tabla, tarjetas, diálogos, formulario
```

Los `page.tsx` se quedan en `app/` porque Next.js enruta por carpetas. Cada uno obtiene los datos del repo y compone componentes de la feature.

Reglas de dependencias (en un solo sentido):

`app/` (rutas) → `components` → `actions` / `data` → `domain`

- `domain/` no importa React, Next, `server-only`, `@/app/*` ni Supabase. Es lógica pura y testeable.
- Los componentes no importan `@supabase/*`, `store.ts` ni `mock.ts`. Piden datos desde la página (vía `empresas.repo.ts`) o llaman a una Server Action.
- Páginas y acciones acceden a los datos solo con `@/features/empresas/data/empresas.repo`. No importan `store.ts` ni `mock.ts` directamente. Al conectar Supabase se sustituye la implementación del repo y se mantienen las firmas.
- Los tipos de la base de datos (`packages/supabase`) solo se usan en `data/`, para convertirlos a los tipos de `domain/types.ts`. El resto de la app usa tipos de dominio.
- Una Server Action hace siempre: `requirePlatformUser()`, validar con zod y llamar al repo o a una Edge Function. Los archivos con `"use server"` solo exportan funciones async; los helpers van en archivos aparte (`revalidar-empresa.ts`, `state.ts`).
- Los imports entre capas de la feature usan el alias `@/features/...`. Dentro de una misma carpeta se usan imports relativos.
- Una feature nueva (catálogo de objetos, soporte...) sigue la misma estructura en `features/<nombre>/`. Lo que necesite otra app sube a `packages/` solo cuando exista esa segunda app.

## Reglas

- Todo layout bajo `app/(protegido)/` comprueba en servidor que hay sesión y que el usuario tiene rol `plataforma`. Si no, `redirect('/login')`.
- Las mutaciones son Server Actions que llaman a Edge Functions. Ninguna escribe directamente en tablas de empresa. Cada acción vuelve a comprobar el rol.
- Formularios validados con zod en servidor. NIF portugués: 9 dígitos con dígito de control (`features/empresas/domain/nif.ts`).
- Interfaz en portugués de Portugal.
- `noindex` en el layout raíz.
- Rutas siempre con `ROUTES` (`app/lib/routes.ts`), nunca strings sueltos.
- Componentes compartidos en `app/components/`: `ui/button` (`Button`, `ButtonLink`), `ui/card`, `ui/status-pill`, `ui/step-icon`, `ui/description-item`, `form/fields`, `back-link`, `page-title`. No copies clases de botones o campos: usa estos componentes. Si hace falta una variante, se añade ahí.
- El estado de una empresa no se guarda: se calcula con `deriveEstado()` (`features/empresas/domain/estado.ts`).

## Estado actual y pendientes (22/10/2026)

Las 4 pantallas están hechas, pero **sin Supabase**: todo es simulación. Antes de usar datos reales hay que resolver lo siguiente.

Provisional o simulado:
- `app/lib/auth.ts`: `requirePlatformUser()` no comprueba nada y devuelve un usuario ficticio. Sustituir por sesión + rol `plataforma` + MFA.
- `features/empresas/data/store.ts`: almacén en memoria (se pierde al reiniciar el servidor), detrás de `empresas.repo.ts`. Sustituir por consultas a Supabase y por Edge Functions (`crear-empresa`, reenviar convite, desactivar...), con registro de auditoría (RNF-08).
- `features/empresas/data/mock.ts`: empresas de ejemplo con textos entre corchetes. Los links de convite son simulados (`https://app.mudaro.pt/convite/simulado-...`).
- Validez del convite: 7 días (`CONVITE_VALIDADE_DIAS` en `features/empresas/data/store.ts`). Confirmar con Supabase Auth.
- `features/empresas/domain/regioes.ts`: una región de ejemplo.
- `/login`: el botón "Entrar" del paso del código no hace nada y la alerta de error nunca se muestra (falta la Server Action con MFA). "Esqueceu-se da palavra-passe?" está omitido: no hay pantalla.

Sin diseño de flujo (botones inertes, con "em breve"):
- "Editar dados", "Registar contrato", "Desativar" y "Ver" de un utilizador, "Catálogo de objetos" y "Suporte".
- No hay botón de cerrar sesión.

Otros:
- No hay control de NIF o email de administrador duplicados.
- Sin CSP. Hay `X-Frame-Options: DENY` y `noindex`; la CSP necesita nonce vía `proxy.ts`.
- La validación de formularios es solo en servidor (con `noValidate`); no hay validación zod en el cliente.
- Sin `proxy.ts` (arquitectura: redirigir a `/login` si no hay sesión).
- Sin tests automáticos: no hay runner en el repo.
