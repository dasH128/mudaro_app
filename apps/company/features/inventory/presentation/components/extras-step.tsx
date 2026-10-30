import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatEuro } from "@/app/lib/format";
import type { ExtraService } from "../../domain/types";
import type { InventoryText } from "../inventory-text";

type Props = {
  lang: Locale;
  t: InventoryText;
  extras: readonly ExtraService[];
  chosen: Readonly<Record<string, boolean>>;
  onToggle: (id: string) => void;
};

export function ExtrasStep({ lang, t, extras, chosen, onToggle }: Props) {
  const e = t.extras;

  return (
    <section aria-labelledby="inventory-extras" className="flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-6">
      <div className="flex flex-col gap-1">
        <h2 id="inventory-extras" className="font-display text-[22px] font-extrabold">
          {e.title}
        </h2>
        <p className="text-sm text-muted">{e.subtitle}</p>
      </div>

      {extras.length === 0 ? <p className="text-sm text-muted">{e.empty}</p> : null}

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
        {extras.map((extra) => {
          const on = chosen[extra.id] === true;
          const quantity = extra.defaultQuantity;
          return (
            <button
              key={extra.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => onToggle(extra.id)}
              className={`flex cursor-pointer flex-col items-start gap-1.5 rounded-[18px] p-4.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                on ? "border-2 border-foreground bg-surface" : "border border-line bg-surface-soft"
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2.5">
                <span className="text-[15px] font-bold">{extra.name}</span>
                <span
                  aria-hidden="true"
                  className={`grid size-6 flex-none place-items-center rounded-lg ${
                    on ? "bg-foreground text-background" : "border-2 border-field-border bg-surface"
                  }`}
                >
                  {on ? <Icon name="check" size={14} strokeWidth={3} /> : null}
                </span>
              </span>
              <span className="text-[13px] text-muted">
                {interpolate(e.pricing[extra.pricing.kind], { price: formatEuro(extra.pricing.cents) })}
              </span>
              {on && quantity ? (
                <span className="text-[13px] font-bold">
                  {interpolate(e.quantity, {
                    quantity: pluralize(lang, quantity.value, e.units[quantity.unit]),
                  })}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
