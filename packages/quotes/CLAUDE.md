# packages/quotes

Motor de cálculo del orçamento (RF-30 a RF-37). TypeScript puro: sin React, Next ni Supabase. Lo usa `apps/company` en el editor de orçamentos.

- Entrada: líneas del inventario, accesos de cada punto, tarifa vigente, frota activa y km. Salida: valores sugeridos (volumen, vehículos, operários, horas, precio, coste, margen), líneas base del orçamento y alertas.
- El orçamento guarda lo sugerido y lo final (RF-37): la empresa puede cambiar cualquier valor en el editor.
- Importes en céntimos enteros. Volúmenes en m³, horas con dos decimales.
- Tests con `vitest` (`pnpm --filter @mudaro/quotes test`). Cualquier cambio de regla lleva su test.
- Explicación completa del cálculo, con un ejemplo paso a paso: `docs/quote-calculation.md`. Si cambias una regla, actualiza ese documento y su test. Las reglas y valores por defecto son provisionales hasta confirmarlos con empresas del piloto.
