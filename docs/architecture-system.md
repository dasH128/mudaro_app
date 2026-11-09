# Arquitectura · decisiones tomadas

Fecha: 21/10/2026 (actualizado 09/11/2026: pedido y envío, acceso del cliente)

## Monorepo con apps separadas

Un solo repositorio (pnpm workspaces y Turborepo) con una app de Next.js por público:

| App | Dominio | Público | Estado |
| --- | --- | --- | --- |
| `apps/landing` | mudaro.pt | Cualquiera | Existe |
| `apps/admin` | admin.mudaro.pt | Equipo Mudaro | En desarrollo |
| `apps/client` | por decidir | Cliente final con enlace | Futuro |
| `apps/company` | app.mudaro.pt | Administradores de transportistas | Futuro |

Motivo: cada app se despliega por separado, con sus propias variables de entorno y su dominio. La landing pública no comparte proceso, cookies ni secretos con el panel interno. Lo común vive en `packages/`.

La app móvil (Flutter) para administrador y operario vive fuera de este repo.

## Alta de empresas del piloto

Durante el piloto las empresas no se registran solas. El equipo Mudaro las da de alta desde `apps/admin`:

1. El equipo rellena empresa y administrador en el panel.
2. El panel llama a la Edge Function `create-company`.
3. La función comprueba que quien llama tiene rol de plataforma, crea la empresa e invita al administrador con Supabase Auth (email con enlace).
4. El administrador define su contraseña y completa el asistente de configuración en la app.

Cambios respecto a `requisitos-mvp.md`, ya trasladados a `requirement-mvp.md` (22/10/2026):
- RF-65 (P0): alta de empresa desde el panel interno con invitación al administrador por email o enlace. Se añaden RF-66 (lista), RF-67 (detalle) y RF-68 (desactivar y reactivar).
- RF-01 (autorregistro) pasa a P2.
- Sección 4: panel interno web y rol de plataforma.

## Roles

- `plataforma`: equipo Mudaro. Tabla `platform_users` (o claim equivalente), separada de los usuarios de empresa. MFA obligatorio.
- `administrador` y `operario`: usuarios de una empresa, con `company_id`.

## Modelo de datos: pedido y envío

El pedido (`orders`) es la mudanza y el envío (`shipments`) es el pedido enviado a una empresa. En el MVP cada pedido tiene un solo envío, pero el modelo ya permite varias empresas por pedido. El cliente final no tiene cuenta: entra por un enlace del pedido. Modelo completo en `docs/models/mudaro-model.dbml` y decisiones por paso en `docs/plan-modelo-bd.md`.

## Seguridad del panel interno

- Sin clave de servicio en Next.js. Lo privilegiado pasa por Edge Functions que validan el rol.
- `proxy.ts` solo redirige a `/login` si no hay sesión. La comprobación real del rol se hace en servidor en cada página y acción.
- `noindex` y cabeceras de seguridad (CSP, `X-Frame-Options: DENY`).
- Registro de auditoría de altas, invitaciones y cambios de estado (RNF-08).

## Acceso del cliente por enlace

- El enlace pertenece al pedido. El token se guarda solo como hash (`orders.token_hash`) y solo una Edge Function lo valida. Nunca llega a Next.js la clave de servicio (RNF-02).
- La caducidad del enlace bloquea editar el inventario. No impide ver ni aceptar un presupuesto vigente.

## Pendiente de decidir

- Dominio definitivo de `apps/client`.
- Hosting (Vercel por defecto).
- Dónde se construye la web del cliente en el MVP. El cliente rellena el inventario y acepta el presupuesto desde el enlace del pedido (RF-20 a RF-46), pero `apps/client` figura como futuro. Los requisitos nombran Next.js en la sección 4 y dejan "Flutter Web o Angular" como decisión abierta en la sección 11. Hay que decidir app, dominio y tecnología.
