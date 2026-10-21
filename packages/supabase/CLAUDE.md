# packages/supabase

- `src/database.types.ts` se genera con `pnpm db:types`. No se edita a mano.
- `src/browser.ts`: cliente para componentes de cliente (clave pública).
- `src/server.ts`: cliente para Server Components y Server Actions con la sesión del usuario (clave pública y cookies). Lleva `import "server-only"`.
- Aquí nunca hay clave de servicio.
