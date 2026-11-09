# supabase/

- `migrations/`: SQL versionado. El modelo vigente (nombres en inglés, con pedido y envío separados) está en `docs/diagram/mudaro-model.dbml` y su construcción por pasos en `docs/plan-modelo-bd.md`. Cada cambio es una migración nueva; nunca edites una ya aplicada.
- `functions/`: Edge Functions (Deno). Son el único sitio donde existe la clave de servicio.
- Toda función privilegiada empieza validando el JWT de quien llama y su rol antes de usar la clave de servicio.
