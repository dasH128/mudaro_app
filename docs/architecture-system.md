# Arquitectura · decisiones tomadas

Fecha: 21/10/2026

## Monorepo con apps separadas

Un solo repositorio (pnpm workspaces y Turborepo) con una app de Next.js por público:

| App | Dominio | Público | Estado |
| --- | --- | --- | --- |
| `apps/landing` | mudaro.pt | Cualquiera | Existe |
| `apps/admin` | admin.mudaro.pt | Equipo Mudaro | En desarrollo |
| `apps/cliente` | por decidir | Cliente final con enlace | Futuro |
| `apps/empresa` | app.mudaro.pt | Administradores de transportistas | Futuro |

Motivo: cada app se despliega por separado, con sus propias variables de entorno y su dominio. La landing pública no comparte proceso, cookies ni secretos con el panel interno. Lo común vive en `packages/`.

La app móvil (Flutter) para administrador y operario vive fuera de este repo.

## Alta de empresas del piloto

Durante el piloto las empresas no se registran solas. El equipo Mudaro las da de alta desde `apps/admin`:

1. El equipo rellena empresa y administrador en el panel.
2. El panel llama a la Edge Function `crear-empresa`.
3. La función comprueba que quien llama tiene rol de plataforma, crea la empresa e invita al administrador con Supabase Auth (email con enlace).
4. El administrador define su contraseña y completa el asistente de configuración en la app.

Cambios respecto a `requisitos-mvp.md`, ya trasladados a `requirement-mvp.md` (22/10/2026):
- RF-65 (P0): alta de empresa desde el panel interno con invitación al administrador por email o enlace. Se añaden RF-66 (lista), RF-67 (detalle) y RF-68 (desactivar y reactivar).
- RF-01 (autorregistro) pasa a P2.
- Sección 4: panel interno web y rol de plataforma.

## Roles

- `plataforma`: equipo Mudaro. Tabla `usuarios_plataforma` (o claim equivalente), separada de los usuarios de empresa. MFA obligatorio.
- `administrador` y `operario`: usuarios de una empresa, con `empresa_id`.

## Seguridad del panel interno

- Sin clave de servicio en Next.js. Lo privilegiado pasa por Edge Functions que validan el rol.
- `proxy.ts` solo redirige a `/login` si no hay sesión. La comprobación real del rol se hace en servidor en cada página y acción.
- `noindex` y cabeceras de seguridad (CSP, `X-Frame-Options: DENY`).
- Registro de auditoría de altas, invitaciones y cambios de estado (RNF-08).

## Pendiente de decidir

- Dominio definitivo de `apps/cliente`.
- Hosting (Vercel por defecto).
