# packages/validation · Reglas de datos compartidas

Funciones puras que validan o interpretan datos de Portugal y que usan varias apps: NIF, teléfono y fechas `dd/mm/aaaa`.

## Qué entra aquí

- TypeScript puro y sin dependencias: ni React, ni Next, ni Supabase, ni zod. Es lógica de dominio que se puede probar sola.
- Solo reglas que usan **dos o más apps**. Una regla de una sola app vive en el `domain/` de su feature.
- Reglas de formato y de localización (euros, `Intl`) no entran: cada app las tiene en su `app/lib/format.ts`.

## Contenido

| Fichero | Exporta | Regla |
| --- | --- | --- |
| `tax-id.ts` | `isValidTaxId` | NIF: 9 dígitos con dígito de control (módulo 11). Debe coincidir con `is_valid_tax_id` de la base de datos |
| `phone.ts` | `isValidPtPhone`, `normalizePtPhone` | 9 dígitos, con o sin `+351` y espacios. `normalizePtPhone` devuelve `+351XXXXXXXXX` |
| `date.ts` | `parseDatePt` | `dd/mm/aaaa` a `aaaa-mm-dd`, o `null` si no es una fecha real |

## Uso

Se añade `"@mudaro/validation": "workspace:*"` a la app y el paquete a `transpilePackages` de `next.config.ts` (exporta `.ts` sin build previo). Los schemas de zod de cada app lo envuelven con `refine`.

Las Edge Functions (Deno) no importan este paquete: repiten la regla en SQL o en `supabase/functions/_shared`. Si cambias una regla aquí, revisa también la versión de la base de datos.
