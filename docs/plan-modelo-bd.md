# Mudaro · Plan del modelo de base de datos

Fecha: 25/10/2026
Fuentes: `requirement-mvp.md` (RF y RNF citados), `architecture-system.md`, `supabase/CLAUDE.md`.

El esquema completo (22 tablas) está en el documento "Modelo de negocio y dominio", que no está en el repo. Este plan lo construye por bloques, en orden de dependencias. Cada bloque es una migración nueva en `supabase/migrations/`.

## Orden de construcción

| Paso | Bloque | Requisitos | Estado |
| --- | --- | --- | --- |
| 1 | Base: equipo Mudaro, empresas, usuarios, convites, auditoría | RF-03, RF-65 a RF-68, RNF-01, RNF-08 | En curso |
| 2 | Configuración: vehículos, tarifas versionadas, servicios extra, perfil | RF-02, RF-05 a RF-07 | Pendiente |
| 3 | Catálogo global de objetos (sin `company_id`) | RF-10, RF-11 | Pendiente |
| 4 | Solicitudes, clientes, inventario, enlaces con token | RF-13 a RF-27, RNF-02 | Pendiente |
| 5 | Presupuestos, propuestas, aceptación | RF-30 a RF-46 | Pendiente |
| 6 | Agenda, trabajos, actas, incidencias, cierre | RF-47 a RF-62 | Pendiente |

La autenticación no es un bloque de tablas. Supabase Auth gestiona las cuentas. El esquema solo modela los vínculos: qué cuenta es de plataforma, a qué empresa pertenece cada usuario y qué invitaciones están pendientes.

Los clientes no son un bloque aparte. Las fichas de cliente pertenecen a cada empresa y se crean con las solicitudes (paso 4). El cliente final no tiene cuenta en el MVP (`cuentas_cliente` es fase 3).

## Convención de nombres

Tablas, columnas, funciones, enums y políticas en inglés. Los comentarios SQL, en español. Los términos portugueses sin equivalente directo se explican en un comentario (por ejemplo, `tax_id` es el NIF).

## Paso 1 · Decisiones tomadas

- **Un operario pertenece a una sola empresa.** La clave primaria de `company_users` es el `id` de Auth. Si la decisión abierta de "operario en varias empresas" cambia, habrá que añadir una tabla intermedia.
- **MFA obligatorio para plataforma** se exige en la propia función `is_platform_user()` (`aal2`). Así la base de datos lo impide aunque la app no lo compruebe.
- **Las escrituras no van directas desde el navegador.** Solo hay políticas de lectura para `authenticated`. Crear empresas, invitar y desactivar pasan por Edge Functions que validan el rol y usan la clave de servicio (`architecture-system.md`).
- **`companies` lleva `country_code`** (ISO 3166-1 alfa-2, por defecto `PT`) junto a `tax_id`. La unicidad es por `(country_code, tax_id)` y el dígito de control del NIF solo se valida cuando el país es `PT`. Al abrir otros países, la validación se hará en servidor con zod por país y se quitará el valor por defecto.
- **Notas internas, origen y región van en `company_internal`**, con RLS solo para plataforma. Así una empresa no puede leer las notas del equipo aunque tenga acceso a su fila.
- **La invitación guarda solo el hash del token** (`token_hash`), nunca el token en claro (RNF-02).
- **Una única invitación pendiente de administrador por empresa**, forzada con un índice parcial. "Generar enlace nuevo" revoca la anterior antes de crear la siguiente.
- **Caducidad de la invitación de 7 días** como valor por defecto, provisional (decisión abierta del requisito).
- **Auditoría inmutable**: bloqueo de `update`, `delete` y `truncate` con trigger. Sin clave foránea en `company_id`, para que el registro sobreviva a una empresa borrada.

## Paso 1 · Migraciones

1. `20261025100000_platform.sql`: `platform_users`, `is_platform_user()`, `set_updated_at()`.
2. `20261025100100_companies.sql`: `is_valid_tax_id()`, `companies`, `company_internal`.
3. `20261025100200_company_users_invitations.sql`: enum `company_role` (`administrator`, `operator`), `company_users`, `invitations`, `current_company_id()`, y la política de `companies` para miembros.
4. `20261025100300_audit_log.sql`: `audit_log` con inmutabilidad.

## Pendiente de decidir (no bloquea el paso 1)

- Qué hacer si se da de alta una empresa con un NIF que ya existe. Hoy hay `unique` sobre `(country_code, tax_id)`, lo que bloquea el alta.
- Región: lista cerrada aún por definir. Hoy es texto libre.
- Caducidad real del convite (depende de la configuración de Supabase Auth).
- Flujos pendientes del panel (editar empresa, registrar IMT o RGPD después del alta, desactivar un usuario concreto).
