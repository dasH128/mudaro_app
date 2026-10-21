# supabase/

- `migrations/`: SQL versionado. El esquema base (22 tablas) está en el documento "Modelo de negocio y dominio". Cada cambio es una migración nueva; nunca edites una ya aplicada.
- `functions/`: Edge Functions (Deno). Son el único sitio donde existe la clave de servicio.
- Toda función privilegiada empieza validando el JWT de quien llama y su rol antes de usar la clave de servicio.
