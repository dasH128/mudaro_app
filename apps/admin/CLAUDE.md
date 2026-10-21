# apps/admin · Panel interno Mudaro

Solo lo usa el equipo Mudaro. Sirve para dar de alta las empresas del piloto, mantener el catálogo global de objetos y dar soporte.

## Pantallas del MVP

| Ruta | Pantalla | Notas |
| --- | --- | --- |
| `/login` | Entrar | Email y contraseña de Supabase Auth, con MFA |
| `/empresas` | Lista de empresas | Búsqueda y filtro por estado: convite pendiente, en configuración, activa, desactivada |
| `/empresas/nueva` | Nueva empresa | Datos de empresa, administrador y piloto. Llama a la Edge Function `crear-empresa` |
| `/empresas/[id]` | Detalle | Estado del convite, copiar enlace, reenviar, progreso de configuración, historial |

Referencia visual: lienzo "Mudaro · Acesso e registo", fila "Painel interno" (P1, P2 y P3).

## Reglas

- Todo layout bajo `app/(protegido)/` comprueba en servidor que hay sesión y que el usuario tiene rol `plataforma`. Si no, `redirect('/login')`.
- Las mutaciones son Server Actions que llaman a Edge Functions. Ninguna escribe directamente en tablas de empresa.
- Formularios validados con zod en servidor. NIF portugués: 9 dígitos con dígito de control.
- Interfaz en portugués de Portugal.
- `noindex` en el layout raíz.
