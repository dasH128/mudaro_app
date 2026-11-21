# Arquitectura · decisiones tomadas

Fecha: 21/10/2026 (actualizado 09/11/2026: pedido y envío, acceso del cliente)

## Monorepo con apps separadas

Un solo repositorio (pnpm workspaces y Turborepo) con una app de Next.js por público:

| App | Dominio | Público | Estado |
| --- | --- | --- | --- |
| `apps/landing` | mudaro.pt | Cualquiera | Existe |
| `apps/admin` | admin.mudaro.pt | Equipo Mudaro | En desarrollo |
| `apps/client` | por decidir | Cliente final con enlace | En el MVP (decidido el 19/11/2026) |
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

El pedido (`orders`) es la mudanza y el envío (`shipments`) es el pedido enviado a una empresa. En el MVP cada pedido tiene un solo envío, pero el modelo ya permite varias empresas por pedido. El cliente final no tiene cuenta: entra por un enlace del pedido. Modelo completo en `docs/diagram/mudaro-model.dbml` y decisiones por paso en `docs/plan-modelo-bd.md`.

## Seguridad del panel interno

- Sin clave de servicio en Next.js. Lo privilegiado pasa por Edge Functions que validan el rol.
- `proxy.ts` solo redirige a `/login` si no hay sesión. La comprobación real del rol se hace en servidor en cada página y acción.
- `noindex` y cabeceras de seguridad (CSP, `X-Frame-Options: DENY`).
- Registro de auditoría de altas, invitaciones y cambios de estado (RNF-08).

## Acceso del cliente por enlace

- El enlace pertenece al pedido. El token se guarda solo como hash (`orders.token_hash`) y solo una Edge Function lo valida. Nunca llega a Next.js la clave de servicio (RNF-02).
- La caducidad del enlace bloquea editar el inventario. No impide ver ni aceptar un presupuesto vigente.
- La Edge Function es `client-order` (19/11/2026). Se despliega sin verificación de JWT porque el cliente no tiene sesión: el token del enlace es la autorización. Calcula su hash y llama a `client_save_inventory_draft` y `client_submit_inventory`, que solo puede ejecutar `service_role`.
- Secreto entre servidores (decidido el 21/11/2026, pendiente de implementar antes de abrir el piloto a clientes reales): `apps/client` llama a `client-order` desde el servidor con un secreto compartido en una cabecera, junto con la IP real del navegador. El secreto es una variable de servidor (sin `NEXT_PUBLIC_`) y no da acceso a la base de datos. La función rechaza sin consultar la base de datos cualquier llamada sin él, porque hoy responde a cualquiera sin `apikey`.
- Límite de peticiones: 10 por minuto por token y 30 por minuto por IP, contados en Postgres por la función. Los límites viven en una tabla y se cambian con un `update`, sin desplegar. Detalle en `docs/plan-modelo-bd.md`.

## Web del cliente (decidido el 19/11/2026)

- El cliente abre el enlace del pedido en `apps/client`, una app de Next.js (React) del monorepo, igual que las demás. Ahí rellena el inventario y ve y acepta el presupuesto (RF-20 a RF-46).
- No va dentro de `apps/company`: tiene su propio dominio, así no comparte cookies ni sesión con el panel de las empresas, y el enlace no queda ligado a una empresa (en la fase 3 un pedido puede ir a varias).
- Lo común con `apps/company` (componentes, tokens, reglas de datos de Portugal) se comparte desde `packages/`.
- A futuro, cuando el cliente tenga cuenta, también podrá ver sus pedidos desde una app móvil. Queda fuera del MVP.

## Pendiente de decidir

- Dominio definitivo de `apps/client`.
- Hosting (Vercel por defecto).
