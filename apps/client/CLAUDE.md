# apps/client · Web del cliente

El cliente final no tiene cuenta: entra con el enlace de su pedido (`/p/<token>`), rellena el inventario y, más adelante, ve y acepta el presupuesto (RF-15, RF-19 a RF-46). Decidido el 19/11/2026 (`docs/architecture-system.md`). Dominio por decidir; en local, `pnpm dev --filter=client` en el puerto 3003.

Prototipos en `docs/design/customer/<vista>` (hoy vacía). Lee su `README.md` antes de implementar una vista.

## Pantallas

| Pantalla | Ruta | Estado |
| --- | --- | --- |
| Inicio sin enlace | `/[lang]` | Solo un aviso: "abra o link que recebeu" |
| Inventario del cliente | `/[lang]/p/[token]` | Adaptación del editor de `apps/company` (19/11/2026), sin diseño propio. Objetos, accesos y extras; guarda al cambiar de paso y "Enviar inventário" lo envía. Muestra también "enlace no válido", "plazo terminado" e "inventario enviado" |

## Cómo funciona

- **Sin sesión ni Supabase en el navegador.** El servidor de esta app llama a la Edge Function `client-order` (`supabase/functions/client-order`), que calcula el hash SHA-256 del token, comprueba que el pedido existe, no está cancelado y el enlace sigue vigente, y solo trabaja con ese pedido. La clave de servicio vive solo allí (RNF-02).
- **El token es la autorización.** No se guarda en el navegador ni se muestra. Va en la ruta: por eso `Referrer-Policy: no-referrer`, `noindex` y `Cache-Control: no-store` en `next.config.ts`.
- **El enlace llega sin idioma** (`/p/<token>`, lo genera `apps/company` con `CLIENT_APP_URL`). `proxy.ts` lo reescribe (no redirige) al idioma del navegador; sin idioma reconocido, portugués.
- Validación en servidor con zod (`application/schemas`), igual que la app de la empresa. La Edge Function y la base de datos vuelven a comprobar.

## Estructura

Misma organización por features y capas que `apps/company` (ver su `CLAUDE.md`): `features/order/{domain,application,infrastructure,presentation}`.

- Tipos y reglas del inventario: `@mudaro/inventory` (compartido con `apps/company`).
- Iconos, `Field` y `ChoiceGroup`: `@mudaro/ui`. Fechas y volumen: `@mudaro/validation`.
- Los componentes del editor (`catalog-grid`, `rooms-nav`, `access-form`, `extras-step`, `inventory-steps`, `inventory-footer`, `inventory-summary`) son una copia adaptada de los de `apps/company`. Es provisional: cuando exista el diseño del cliente, lo común sube a `packages/ui` y lo propio de cada app se separa.

## Pendiente

- Diseño propio (móvil primero) a partir de prototipos en `docs/design/customer`.
- Dominio definitivo y `CLIENT_APP_URL` en `apps/company`.
- Limitar la frecuencia de peticiones por IP en la Edge Function antes de abrir el piloto a clientes reales.
- Objetos libres, fotos (bucket de Storage) y ver y aceptar el presupuesto (paso 5).
