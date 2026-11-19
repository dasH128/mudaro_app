import type { Dictionary } from "@/app/i18n/get-dictionary";

import type { TariffNumberField, TariffValues } from "../application/schemas/tariff";
import { TARIFF_FIELDS } from "../application/schemas/tariff";
import type { Tariff } from "../domain/types";

export type PricingText = Dictionary["app"]["pricing"];

/** Número → texto del campo, con coma decimal (RNF-10) y sin separador de miles para poder editarlo. */
function toInput(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(".", ",");
}

/** Valores iniciales del formulario a partir de la tarifa vigente: euros con 2 decimales, el resto sin ceros de más. */
export function tariffValues(tariff: Tariff): TariffValues {
  const entries = (Object.keys(TARIFF_FIELDS) as TariffNumberField[]).map((name) => {
    const spec = TARIFF_FIELDS[name];
    const value = tariff[spec.key] as number;
    if (spec.kind === "euros") return [name, toInput(value / 100, 2)];
    if (spec.kind === "integer") return [name, String(value)];
    // 1.2 → "1,2"; 10 → "10"
    return [name, String(value).replace(".", ",")];
  });
  return { ...(Object.fromEntries(entries) as Record<TariffNumberField, string>), quotePresentation: tariff.quotePresentation };
}

/** Importe en céntimos → "12,50" para un campo editable. */
export function centsToInput(cents: number): string {
  return toInput(cents / 100, 2);
}
