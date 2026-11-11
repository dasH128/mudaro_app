# Mudaro · Plan de pruebas del acceso bloqueado (Maqueta 3)

Fecha: 11/11/2026
Alcance: la página `/[lang]/no-access` de `apps/company` y el flujo que lleva a ella: el login (`signInAction`), `requireCompanySession` en cada página y el cálculo del motivo (`getCompanySession` y `blockedReasonOf`).
Fuera de alcance: el 404 y el 500 del panel (Maquetas 1 y 2), los errores al guardar (Maqueta 4) y la app móvil del operario.
Fuentes: propuesta "Errores del panel Mudaro" (artifact), `apps/company/CLAUDE.md` (fila "Acceso bloqueado"), RF-04 y RF-68 de `docs/requirement-mvp.md`, y las políticas de `company_users` y `companies` en `supabase/migrations/20261025100200_company_users_invitations.sql`.

## Cómo usar este documento

- Cada caso tiene un **criterio de aceptación**: pasa solo si se cumple tal cual está escrito.
- **Quién**: *Persona* usa la app en el navegador; *Claude* cambia o comprueba datos con SQL en Supabase, siempre con confirmación previa y dejando todo como estaba al terminar.
- **Estado** es `Pendiente`, `OK (fecha)` o `Fallo`. Un fallo se apunta en "Registro de fallos".
- Para los casos de navegador conviene una ventana privada por usuario, para no mezclar sesiones.

## Cómo se decide el motivo

| Situación en la base de datos | Motivo | Quién lo resuelve |
| --- | --- | --- |
| No hay fila en `company_users` para el usuario | `none` | Mudaro |
| `company_users.active = false` | `account` | El administrador de su empresa |
| Cuenta activa, pero `companies.deactivated_at` con valor (RLS no deja leer la empresa) | `company` | Mudaro |
| Cuenta activa, empresa activa, `role = operator` | `role` | Nadie: usa la app móvil |
| Cuenta activa, empresa activa, `role = administrator` | Sin bloqueo | |

Si la cuenta y la empresa están desactivadas a la vez, sale `account`: con la cuenta inactiva no se puede saber el estado de la empresa.

## Preparación

| Elemento | Valor |
| --- | --- |
| Proyecto Supabase | `mudaro_app` (`hqatdrtcasoxlgucsjyh`) |
| App | `pnpm dev --filter=company` y, para el caso N5, `pnpm dev --filter=admin` |
| Estado de partida (11/11/2026) | 2 empresas activas, cada una con 1 administrador activo; 0 operarios; 1 usuario de plataforma |
| Empresa principal | La de los pedidos de prueba del paso 4a. **No se toca** en ningún caso: su administrador se usa solo en N2, N3 y R1 a R4 |
| Empresa de prueba | La segunda empresa (creada el 11/11/2026, sin pedidos). Su administrador es el **administrador de prueba**: los casos N5 a N8 lo bloquean temporalmente y Claude lo revierte con SQL en cuanto la persona confirma |
| Usuario de plataforma | El del panel `apps/admin`. Sirve para el motivo `none` sin tocar datos |
| Email de soporte | `suporte@mudaro.exemplo` (provisional, pendiente de cambiar) |

**Cambios temporales de datos.** No hay operario, así que los motivos `account` y `role` se prueban cambiando un momento el administrador de la empresa de prueba. Así el administrador principal nunca queda bloqueado. Cada cambio tiene su reversión en la sección "SQL de apoyo". Ningún caso deja datos cambiados: el caso N12 comprueba que todo volvió al estado de partida.

## N. Casos

| ID | Prueba | Pasos | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- | --- |
| N1 | Sin sesión | En una ventana privada, abrir `/pt/no-access` | Redirige al login con `?next=%2Fpt%2Fno-access` | Persona | Pendiente |
| N2 | Administrador con acceso | Con sesión del administrador principal, abrir `/pt/no-access` | Redirige a Início (`/pt`); no se ve la página de bloqueo | Persona | Pendiente |
| N3 | El motivo no viaja en la URL | Con sesión del administrador principal, abrir `/pt/no-access?reason=company` | Igual que N2: redirige a Início. El parámetro no cambia nada | Persona | Pendiente |
| N4 | Cuenta sin empresa (`none`) | En una ventana privada, entrar en el login de `apps/company` con el usuario de plataforma | Tras entrar, va a `/pt/no-access` y muestra la caja con "?", "Esta conta não tem empresa associada", el email de soporte y "Terminar sessão" | Persona | Pendiente |
| N5 | Empresa desactivada (`company`) | Desactivar la **empresa de prueba** desde `apps/admin` (detalle de la empresa, RF-68) con un motivo de prueba. Después, entrar en `apps/company` con el administrador de prueba | Va a `/pt/no-access` y muestra la caja con candado, "O acesso da tua empresa está suspenso", el email de soporte y "Terminar sessão". El administrador principal sigue entrando con normalidad. Al terminar, reactivar la empresa de prueba desde `apps/admin` | Persona | Pendiente |
| N6 | Cuenta desactivada (`account`) | Claude pone `company_users.active = false` al administrador de prueba. Entrar en `apps/company` con él | Muestra la credencial tachada y "A tua conta foi desativada"; **no** muestra el email de soporte. Claude lo revierte | Persona y Claude | Pendiente |
| N7 | Operario (`role`) | Claude cambia el rol del administrador de prueba a `operator`. Entrar en `apps/company` con él | Muestra el teléfono y "O painel web é para administradores"; **no** muestra el email de soporte. Claude lo revierte | Persona y Claude | Pendiente |
| N8 | Bloqueo con la sesión abierta | Con sesión del administrador de prueba abierta en `/pt/orders`, Claude pone `company_users.active = false`. Recargar la página | Redirige a `/pt/no-access` con el motivo `account`. Claude lo revierte | Persona y Claude | Pendiente |
| N9 | Sin datos tras el bloqueo | Durante N6, abrir directamente `/pt/orders`, `/pt/orders/MD-0001` y `/pt/fleet` | Las tres redirigen a `/pt/no-access`; no se ve ningún dato del panel | Persona | Pendiente |
| N10 | Terminar sesión | En la página de bloqueo (cualquier motivo), pulsar "Terminar sessão" | Va al login. Abrir después `/pt/no-access` lleva al login (como N1) | Persona | Pendiente |
| N11 | Copiar email | En N4 o N5, pulsar "Copiar email" y pegar en cualquier campo | Se pega `suporte@mudaro.exemplo`; el botón muestra "Copiado ✓" unos segundos | Persona | Pendiente |
| N12 | Vuelta al estado de partida | Tras N5 a N8 | Las dos empresas están activas, los dos administradores activos y con rol `administrator`, y ambos entran en el panel con normalidad | Claude y Persona | Pendiente |
| N13 | Idiomas | Repetir N4 en `/es/no-access` y `/en/no-access` | Textos traducidos, sin claves visibles; el email y el botón también | Persona | Pendiente |
| N14 | Tema oscuro y móvil | Repetir N4 con el tema oscuro y con la ventana a unos 400 px de ancho | Ilustración y textos legibles, sin desbordes; en móvil no aparece el panel de marca y la tarjeta ocupa el ancho | Persona | Pendiente |

## R. Regresión del login

| ID | Prueba | Criterio de aceptación | Quién | Estado |
| --- | --- | --- | --- | --- |
| R1 | Login correcto | El administrador principal entra y llega a Início | Persona | Pendiente |
| R2 | Login con `next` | Sin sesión, abrir `/pt/orders`, entrar y comprobar que vuelve a `/pt/orders` | Persona | Pendiente |
| R3 | Contraseña errónea | Muestra "Email ou palavra-passe incorretos." y no entra | Persona | Pendiente |
| R4 | Enlace antiguo | Abrir `/pt/login?error=no-access` sin sesión | Muestra el login normal, sin mensaje de error (ese parámetro ya no se usa) | Persona | Pendiente |
| R5 | `pnpm lint` y `pnpm typecheck` en la raíz | Terminan sin errores | Claude | OK (11/11/2026) |

## SQL de apoyo

Solo los ejecuta Claude, con confirmación previa. `<admin_id>` es el `id` del administrador de la **empresa de prueba** en `company_users`, nunca el del administrador principal.

```sql
-- Comprobar el estado de partida (N12): las dos empresas y sus usuarios
select c.id as company_id, c.deactivated_at, cu.id as user_id, cu.role, cu.active
from public.companies c join public.company_users cu on cu.company_id = c.id
order by c.created_at;

-- N6 y N8: desactivar la cuenta, y revertir
update public.company_users set active = false where id = '<admin_id>';
update public.company_users set active = true  where id = '<admin_id>';

-- N7: rol de operario, y revertir
update public.company_users set role = 'operator'      where id = '<admin_id>';
update public.company_users set role = 'administrator' where id = '<admin_id>';
```

La empresa de prueba (N5) se desactiva y reactiva desde `apps/admin`, no con SQL: así también se prueba el flujo real de RF-68 y queda en el registro de auditoría.

## Criterio de salida

La Maqueta 3 se da por validada cuando:

1. Todos los casos de las secciones N y R están en `OK`.
2. Los casos de seguridad (N3, N8 y N9) pasan sin excepción.
3. N12 confirma que los datos volvieron al estado de partida.
4. Queda anotado como limitación conocida, no como fallo: el email de soporte es provisional y la pantalla no puede mostrar el nombre de una empresa desactivada.

## Registro de fallos

| Caso | Fecha | Qué se vio | Qué se esperaba | Estado |
| --- | --- | --- | --- | --- |
| | | | | |
