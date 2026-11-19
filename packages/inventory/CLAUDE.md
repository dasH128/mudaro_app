# packages/inventory

Reglas y tipos del inventario de un pedido que usan `apps/company` (la empresa rellena el inventario) y `apps/client` (el cliente lo rellena desde su enlace). TypeScript puro: sin React, Next ni Supabase.

- Catálogo (`CatalogItem`, `CatalogRoom`, `ExtraType`), líneas por división (`lineKey`), accesos (`AccessPoint`, `isAccessComplete`, RF-23), totales (`summarize`) y errores del guardado.
- Cada app traduce sus datos a estos tipos en su capa `infrastructure/`. Los textos se traducen en cada app.
- Si una regla del inventario la necesitan las dos apps, va aquí. No la copies.
